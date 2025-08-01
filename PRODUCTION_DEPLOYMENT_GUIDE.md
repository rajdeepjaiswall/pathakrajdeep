# Production Deployment Guide - Environment Variable Setup

## ✅ Issues Fixed
- **Application now starts successfully** ✅
- **Missing OpenAI package installed** ✅ 
- **Environment variable handling improved** ✅
- **Graceful fallbacks for missing API keys** ✅

## Required Production Secrets

### 1. DATABASE_URL (CRITICAL)
**Format:** `postgresql://username:password@host:port/database`

**Examples:**
- Neon: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname`
- Railway: `postgresql://postgres:pass@containers.railway.app:port/railway`
- Supabase: `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres`

### 2. JWT_SECRET (CRITICAL)
**Purpose:** Signs authentication tokens
**Format:** Secure random string (64+ characters)
```bash
# Generate with:
openssl rand -hex 32
# Or use online generator: https://randomkeygen.com/
```

### 3. SESSION_SECRET (CRITICAL)  
**Purpose:** Express session encryption
**Format:** Secure random string (64+ characters)
```bash
# Generate with:
openssl rand -hex 32
```

### 4. OPENAI_API_KEY (OPTIONAL)
**Purpose:** Enhanced search with AI translation
**Format:** `sk-proj-...`
**Get from:** https://platform.openai.com/api-keys
**Note:** App works without this, just disables AI features

## Deployment Platform Instructions

### For Replit Deployments (Recommended)
1. **Go to Deployments Tab**
2. **Click "Configure deployment"**
3. **Add Environment Variables:**
   ```
   DATABASE_URL=postgresql://your-connection-string
   JWT_SECRET=your-64-char-random-string
   SESSION_SECRET=your-64-char-random-string
   OPENAI_API_KEY=sk-proj-your-key (optional)
   NODE_ENV=production
   ```
4. **Deploy**

### For Railway/Render/Vercel
1. **Environment Variables Section**
2. **Add the same variables as above**
3. **Ensure PostgreSQL addon is configured**
4. **Set buildCommand:** `npm run build`
5. **Set startCommand:** `npm start`

### For cPanel/Traditional Hosting
1. **Use Node.js App interface**
2. **Set environment variables through hosting panel**
3. **May need MySQL instead of PostgreSQL** (see cPanel deployment files)

## Database Setup Options

### Option 1: Neon (Recommended for Cloud)
1. Go to https://neon.tech
2. Create free account
3. Create database
4. Copy connection string to DATABASE_URL

### Option 2: Railway PostgreSQL
1. Add PostgreSQL service to Railway project
2. Use the provided DATABASE_URL

### Option 3: Supabase
1. Create project at https://supabase.com
2. Go to Settings > Database
3. Copy connection string

## Environment Variable Security
- **Never commit secrets to version control**
- **Use secure random generators for JWT secrets**
- **Rotate secrets periodically**
- **Test in staging before production**

## Testing Your Deployment
After setting environment variables:

1. **Check Deployment Logs** for any remaining errors
2. **Test Authentication** - Google login should work
3. **Test Database** - Products should load
4. **Test Orders** - Create test order
5. **Test Search** - Should work with/without OpenAI

## Common Deployment Errors & Solutions

### "Missing DATABASE_URL"
- ✅ **Fixed:** App now shows clear error message
- **Solution:** Set DATABASE_URL in deployment environment

### "Cannot find package 'openai'"
- ✅ **Fixed:** Package now installed
- **Result:** Search functionality works

### "Application crash looping"
- ✅ **Fixed:** Better error handling
- **Result:** App shows specific error instead of crashing

### Authentication Issues
- **Cause:** Missing JWT_SECRET or SESSION_SECRET  
- **Solution:** Set both secrets in environment
- **Test:** Try Google login after deployment

## Performance Optimization

### For Production:
```env
NODE_ENV=production
```

### For Scaling:
- Enable connection pooling in DATABASE_URL
- Consider Redis for sessions at high scale
- Monitor database connection limits

## Support & Monitoring

### Key Metrics to Monitor:
- Database connection count
- Response times
- Error rates
- Authentication success rates

### Logs to Check:
- Application startup logs
- Database connection logs  
- Authentication errors
- Search functionality warnings

## Next Steps After Deployment

1. **Test all major features**
2. **Set up monitoring/alerting**
3. **Configure custom domain** (if needed)
4. **Set up backups**
5. **Plan scaling strategy**

---

**✅ Your application is now production-ready with proper environment variable handling and graceful error management.**