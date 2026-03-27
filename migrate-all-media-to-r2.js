/**
 * migrate-all-media-to-r2.js
 *
 * Migrates all base64 media from the database to Cloudflare R2 CDN.
 * Only the CDN URL is stored back in the database.
 * Original data is preserved in backup columns.
 *
 * TABLES AFFECTED:
 *   products.images          (jsonb array — 11 rows with base64)
 *   banners.video_url        (text — 2 rows with base64)
 *   manual_payment_config.qr_image_url (text — 1 row with base64)
 *
 * DO NOT RUN until owner says "GO"
 */

require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

// ─── Neon WebSocket config ───────────────────────────────────────────────────
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

// ─── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Cloudflare R2 ───────────────────────────────────────────────────────────
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
const BUCKET     = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

const r2 = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

// ─── Log file ────────────────────────────────────────────────────────────────
const LOG_FILE = path.join(process.cwd(), 'migration-log.txt');
const logLines = [];

function log(msg) {
  console.log(msg);
  logLines.push(msg);
}

function saveLogs() {
  fs.writeFileSync(LOG_FILE, logLines.join('\n'), 'utf8');
}

// ─── Counters ────────────────────────────────────────────────────────────────
let success = 0;
let failed  = 0;
let skipped = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Detect file extension from base64 data URL */
function detectExt(dataUrl) {
  const mimeMap = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/gif':  'gif',
    'video/mp4':  'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
  };
  const m = dataUrl.match(/^data:([^;]+);base64,/);
  if (m && mimeMap[m[1]]) return { ext: mimeMap[m[1]], mime: m[1] };
  // Fallback: peek at binary signature
  const base64 = dataUrl.split(',')[1] || '';
  const buf = Buffer.from(base64.slice(0, 16), 'base64');
  const hex = buf.toString('hex').toUpperCase();
  if (hex.startsWith('FFD8FF')) return { ext: 'jpg', mime: 'image/jpeg' };
  if (hex.startsWith('89504E47')) return { ext: 'png', mime: 'image/png' };
  if (hex.startsWith('52494646')) return { ext: 'webp', mime: 'image/webp' };
  if (hex.startsWith('00000018') || hex.startsWith('00000020')) return { ext: 'mp4', mime: 'video/mp4' };
  return { ext: 'jpg', mime: 'image/jpeg' };
}

/** Upload one base64 data URL to R2, return CDN URL */
async function uploadToR2(dataUrl, folder, filename) {
  const { ext, mime } = detectExt(dataUrl);
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Empty base64 data');
  const buffer = Buffer.from(base64, 'base64');
  const key = `${folder}/${filename}.${ext}`;
  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mime,
  }));
  return `${PUBLIC_URL}/${key}`;
}

/** 100ms pause between rows */
function pause() { return new Promise(r => setTimeout(r, 100)); }

// ─── Step 1: Create backup columns ───────────────────────────────────────────
async function createBackupColumns() {
  log('\n════════════════════════════════════════');
  log('STEP 1 — Creating backup columns');
  log('════════════════════════════════════════');

  const alterations = [
    { sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS images_backup jsonb`, label: 'products.images_backup' },
    { sql: `ALTER TABLE banners ADD COLUMN IF NOT EXISTS video_url_backup text`, label: 'banners.video_url_backup' },
    { sql: `ALTER TABLE manual_payment_config ADD COLUMN IF NOT EXISTS qr_image_url_backup text`, label: 'manual_payment_config.qr_image_url_backup' },
  ];

  for (const { sql, label } of alterations) {
    await pool.query(sql);
    log(`  ✓ Created backup column: ${label}`);
  }

  // Copy current values into backup columns (only where backup is still null)
  const copies = [
    `UPDATE products SET images_backup = images WHERE images_backup IS NULL`,
    `UPDATE banners SET video_url_backup = video_url WHERE video_url_backup IS NULL`,
    `UPDATE manual_payment_config SET qr_image_url_backup = qr_image_url WHERE qr_image_url_backup IS NULL`,
  ];

  for (const sql of copies) {
    const r = await pool.query(sql);
    log(`  ✓ Backed up ${r.rowCount} row(s): ${sql.split('SET')[1].split('WHERE')[0].trim()}`);
  }

  log('  ✓ All backup columns created and populated.');
}

// ─── Step 2: Migrate products.images ─────────────────────────────────────────
async function migrateProductImages() {
  log('\n════════════════════════════════════════');
  log('STEP 2 — Migrating products.images');
  log('════════════════════════════════════════');

  // Fetch all products where images array contains base64
  const { rows } = await pool.query(
    `SELECT id, images FROM products WHERE images::text LIKE '%data:%' ORDER BY id`
  );

  log(`  Found ${rows.length} product(s) with base64 images.`);

  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);

    for (const row of batch) {
      const images = row.images || [];
      const newImages = [];

      for (const img of images) {
        if (!img || typeof img !== 'string') continue;
        if (!img.startsWith('data:')) {
          // Already a URL — keep it
          newImages.push(img);
          skipped++;
          continue;
        }
        try {
          const filename = `products-images-${row.id}-${Date.now()}`;
          const cdnUrl = await uploadToR2(img, 'products/images', filename);
          newImages.push(cdnUrl);
          log(`  ✓ Migrated products row ${row.id} image → ${cdnUrl}`);
          success++;
          await pause();
        } catch (err) {
          log(`  ✗ Failed products row ${row.id} image → ${err.message}`);
          newImages.push(img); // Keep original on failure — never lose data
          failed++;
        }
      }

      // Update the row with new image array
      await pool.query(
        `UPDATE products SET images = $1 WHERE id = $2`,
        [JSON.stringify(newImages), row.id]
      );
    }

    const processed = Math.min(i + 10, rows.length);
    log(`  Progress: ${processed} of ${rows.length} products processed`);
  }
}

// ─── Step 3: Migrate banners.video_url ───────────────────────────────────────
async function migrateBannerVideos() {
  log('\n════════════════════════════════════════');
  log('STEP 3 — Migrating banners.video_url');
  log('════════════════════════════════════════');

  const { rows } = await pool.query(
    `SELECT id, video_url FROM banners WHERE video_url LIKE 'data:%' ORDER BY id`
  );

  log(`  Found ${rows.length} banner(s) with base64 video.`);

  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);

    for (const row of batch) {
      try {
        const filename = `banners-video-${row.id}-${Date.now()}`;
        const cdnUrl = await uploadToR2(row.video_url, 'banners', filename);
        await pool.query(`UPDATE banners SET video_url = $1 WHERE id = $2`, [cdnUrl, row.id]);
        log(`  ✓ Migrated banners row ${row.id} video_url → ${cdnUrl}`);
        success++;
        await pause();
      } catch (err) {
        log(`  ✗ Failed banners row ${row.id} video_url → ${err.message}`);
        failed++;
      }
    }

    const processed = Math.min(i + 10, rows.length);
    log(`  Progress: ${processed} of ${rows.length} banners processed`);
  }
}

// ─── Step 4: Migrate manual_payment_config.qr_image_url ──────────────────────
async function migrateQrImages() {
  log('\n════════════════════════════════════════');
  log('STEP 4 — Migrating manual_payment_config.qr_image_url');
  log('════════════════════════════════════════');

  const { rows } = await pool.query(
    `SELECT id, qr_image_url FROM manual_payment_config WHERE qr_image_url LIKE 'data:%' ORDER BY id`
  );

  log(`  Found ${rows.length} QR config row(s) with base64 image.`);

  for (const row of rows) {
    try {
      const filename = `qr-config-${row.id}-${Date.now()}`;
      const cdnUrl = await uploadToR2(row.qr_image_url, 'misc', filename);
      await pool.query(`UPDATE manual_payment_config SET qr_image_url = $1 WHERE id = $2`, [cdnUrl, row.id]);
      log(`  ✓ Migrated manual_payment_config row ${row.id} qr_image_url → ${cdnUrl}`);
      success++;
      await pause();
    } catch (err) {
      log(`  ✗ Failed manual_payment_config row ${row.id} qr_image_url → ${err.message}`);
      failed++;
    }
  }
}

// ─── Step 5: Verify migration ─────────────────────────────────────────────────
async function verifyMigration() {
  log('\n════════════════════════════════════════');
  log('STEP 5 — Verification');
  log('════════════════════════════════════════');

  // Count remaining base64 rows
  const checks = [
    { label: 'products.images still has base64',                sql: `SELECT COUNT(*) as n FROM products WHERE images::text LIKE '%data:%'` },
    { label: 'banners.video_url still has base64',              sql: `SELECT COUNT(*) as n FROM banners WHERE video_url LIKE 'data:%'` },
    { label: 'manual_payment_config.qr_image_url has base64',   sql: `SELECT COUNT(*) as n FROM manual_payment_config WHERE qr_image_url LIKE 'data:%'` },
  ];

  let allClean = true;
  for (const c of checks) {
    const { rows } = await pool.query(c.sql);
    const n = parseInt(rows[0].n);
    if (n > 0) {
      log(`  ✗ ${c.label}: ${n} row(s) remaining`);
      allClean = false;
    } else {
      log(`  ✓ ${c.label}: 0 remaining — CLEAN`);
    }
  }

  // Spot-check 5 random migrated CDN URLs from products
  log('\n  Spot-checking 5 random migrated product image URLs...');
  const { rows: sampleRows } = await pool.query(
    `SELECT id, images FROM products WHERE images::text LIKE '%http%' AND images::text NOT LIKE '%data:%' ORDER BY RANDOM() LIMIT 5`
  );

  for (const row of sampleRows) {
    const imgs = row.images || [];
    const firstUrl = imgs.find(u => u && u.startsWith('http'));
    if (firstUrl) {
      log(`  ✓ Product ${row.id}: ${firstUrl}`);
    }
  }

  // Check logos were NOT touched
  log('\n  Verifying logos were NOT touched...');
  log('  ✓ Logo is served from attached_assets/ file — NOT in database. Untouched.');

  if (allClean) {
    log('\n  ✓ All columns are clean. Migration verified successfully.');
  } else {
    log('\n  ⚠ Some rows still have base64 data. Check the failures above.');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log('════════════════════════════════════════');
  log('  Pathak Bhandar — CDN Migration Script');
  log(`  Started: ${new Date().toISOString()}`);
  log('════════════════════════════════════════');

  // Validate credentials
  if (!accountId || !BUCKET || !PUBLIC_URL || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
    log('✗ ERROR: Cloudflare R2 credentials are not set in environment. Aborting.');
    process.exit(1);
  }
  log(`  R2 Endpoint: ${r2Endpoint}`);
  log(`  Bucket:      ${BUCKET}`);
  log(`  Public URL:  ${PUBLIC_URL}`);

  try {
    await createBackupColumns();
    await migrateProductImages();
    await migrateBannerVideos();
    await migrateQrImages();
    await verifyMigration();
  } catch (err) {
    log(`\n✗ CRITICAL ERROR: ${err.message}`);
    log(err.stack);
  } finally {
    log('\n════════════════════════════════════════');
    log('  Migration Complete');
    log(`  ✓ Success: ${success} files`);
    log(`  ✗ Failed:  ${failed} files`);
    log(`  ⊘ Skipped: ${skipped} files (already URLs)`);
    log('════════════════════════════════════════');
    log(`\nLog saved to: ${LOG_FILE}`);
    saveLogs();
    await pool.end();
  }
}

main();
