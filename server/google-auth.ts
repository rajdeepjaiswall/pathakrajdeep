import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Initialize Google OAuth Strategy
export function initializeGoogleAuth() {
  // Only initialize if Google credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not provided - Google login will be disabled");
    return;
  }

  // Determine the callback URL based on environment
  const getCallbackURL = () => {
    // Use current Replit domain for development/testing
    const domain = process.env.REPLIT_DOMAINS || 'localhost:5000';
    return `https://${domain}/api/auth/google/callback`;
  };

  const callbackURL = getCallbackURL();
  console.log(`Google OAuth callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists by Google ID
          const existingUser = await storage.getUserByGoogleId(profile.id);
          
          if (existingUser) {
            // User exists, but update profile photo if it's changed
            let profileImageUrl = null;
            if (profile.photos && profile.photos.length > 0) {
              profileImageUrl = profile.photos[0].value.replace('s96-c', 's200-c');
            }
            
            // Only update if the profile photo URL has changed
            if (profileImageUrl && profileImageUrl !== existingUser.profileImageUrl) {
              const updatedUser = await storage.updateUser(existingUser.id, {
                profileImageUrl: profileImageUrl,
              });
              
              console.log('Updated Google user profile photo:', { 
                id: updatedUser.id, 
                email: updatedUser.email, 
                oldPhoto: existingUser.profileImageUrl,
                newPhoto: updatedUser.profileImageUrl 
              });
              
              return done(null, updatedUser);
            }
            
            return done(null, existingUser);
          }
          
          // Check if user exists by email
          if (profile.emails && profile.emails.length > 0) {
            const emailUser = await storage.getUserByEmail(profile.emails[0].value);
            if (emailUser) {
              // Link Google ID to existing email account and update profile photo
              let profileImageUrl = null;
              if (profile.photos && profile.photos.length > 0) {
                profileImageUrl = profile.photos[0].value.replace('s96-c', 's200-c');
              }
              
              const updatedUser = await storage.updateUser(emailUser.id, {
                googleId: profile.id,
                profileImageUrl: profileImageUrl,
                authProvider: 'google',
                isVerified: true,
              });
              
              console.log('Updated existing user with Google profile photo:', { 
                id: updatedUser.id, 
                email: updatedUser.email, 
                profileImageUrl: updatedUser.profileImageUrl 
              });
              
              return done(null, updatedUser);
            }
          }
          
          // Create new user with enhanced profile photo URL
          let profileImageUrl = null;
          if (profile.photos && profile.photos.length > 0) {
            // Get the highest quality Google profile photo
            profileImageUrl = profile.photos[0].value.replace('s96-c', 's200-c'); // Upgrade to 200px from 96px
            console.log('Google profile photo URL:', profileImageUrl);
          }

          const newUser = await storage.createGoogleUser({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profileImageUrl,
            authProvider: "google",
            role: "customer",
            isVerified: true, // Google accounts are considered verified
            profileCompleted: false, // New Google users need to complete profile
          });
          
          console.log('Created Google user with profile photo:', { 
            id: newUser.id, 
            email: newUser.email, 
            profileImageUrl: newUser.profileImageUrl 
          });
          
          return done(null, newUser);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, undefined);
        }
      }
    )
  );

  // Passport session serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user with ID:', id);
      const user = await storage.getUser(id);
      console.log('Deserialized user:', user ? { id: user.id, email: user.email } : 'not found');
      done(null, user || false);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error, false);
    }
  });
}

// Setup session middleware
export function setupSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "pathak-bakery-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow over HTTP for development and HTTPS proxy setups
      maxAge: sessionTtl,
      sameSite: 'lax', // Allow cross-site requests for OAuth callbacks
      domain: undefined, // Don't restrict domain for flexibility
    },
    name: 'pathak.session', // Custom session name
  }));

  app.use(passport.initialize());
  app.use(passport.session());
}

// Google OAuth routes
export function setupGoogleAuthRoutes(app: Express) {
  // Only setup Google routes if credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    // Provide fallback routes that redirect to regular login
    app.get("/api/auth/google", (req, res) => {
      res.redirect("/customer/login?error=google_not_configured");
    });
    
    app.get("/api/auth/google/callback", (req, res) => {
      res.redirect("/customer/login?error=google_not_configured");
    });
    return;
  }

  // Google OAuth login route with user agent detection
  app.get("/api/auth/google", (req, res, next) => {
    // Check if this is from a mobile browser or embedded webview
    const userAgent = req.get('User-Agent') || '';
    const isMobileWebview = /wv|WebView/.test(userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobileWebview) {
      // Redirect with error for webview
      return res.redirect("/customer/login?error=mobile_webview");
    }
    
    // Proceed with Google OAuth
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account" // Allow account selection
    })(req, res, next);
  });

  // Google OAuth callback route
  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/customer/login" }),
    async (req, res) => {
      try {
        const user = req.user as any;
        
        if (!user) {
          return res.redirect("/customer/login?error=auth_failed");
        }

        // Generate JWT token for the authenticated user
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || "pathak-bakery-default-secret-key-2024";
        
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Set secure HTTP-only cookie with the JWT token
        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax'
        });

        // Also set a client-readable flag to indicate login success
        res.cookie('isLoggedIn', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax'
        });

        console.log('Google OAuth success - JWT token issued for user:', user.id);

        // Check if user needs to complete profile
        if (user && !user.profileCompleted) {
          res.redirect("/complete-profile?google_auth=success");
        } else {
          res.redirect("/account?google_auth=success");
        }
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        res.redirect("/customer/login?error=callback_failed");
      }
    }
  );

  // Note: /api/auth/status endpoint is handled in routes.ts to support both JWT and session auth

  // Logout route (clears both session and JWT cookies)
  app.post("/api/auth/logout", (req, res) => {
    // Clear JWT cookie
    res.clearCookie('authToken');
    res.clearCookie('isLoggedIn');
    
    // Also clear session if it exists
    req.logout((err) => {
      if (err) {
        console.error("Session logout error:", err);
      }
      
      // Destroy session completely
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destruction error:", sessionErr);
        }
        res.json({ message: "Logged out successfully" });
      });
    });
  });
}