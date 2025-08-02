import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OAuth2Client } from "google-auth-library";
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
  const sessionTtl = 60 * 60 * 1000; // 1 hour as requested
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  // Enhanced session configuration with debugging
  console.log('Session configuration:', {
    environment: process.env.NODE_ENV,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: '1 hour',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "pathak-bakery-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl, // 1 hour
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site for OAuth
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

        // Create session for the authenticated user
        (req.session as any).user = {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        };

        console.log('Google OAuth success - Session created for user:', user.id);

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

  // Google One Tap credential verification endpoint
  app.post("/api/auth/google/verify", async (req, res) => {
    try {
      const { credential } = req.body;
      
      if (!credential) {
        return res.status(400).json({ message: "No credential provided" });
      }

      console.log('Verifying Google One Tap credential...');
      
      // Create OAuth2Client to verify the credential
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      
      // Verify the credential
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      console.log('Google One Tap verification successful:', { 
        sub: payload.sub, 
        email: payload.email 
      });

      // Check if user exists by Google ID
      let user = await storage.getUserByGoogleId(payload.sub);
      
      if (!user && payload.email) {
        // Check if user exists by email
        user = await storage.getUserByEmail(payload.email);
        if (user) {
          // Link Google ID to existing account
          user = await storage.updateUser(user.id, {
            googleId: payload.sub,
            profileImageUrl: payload.picture?.replace('s96-c', 's200-c'),
          });
        }
      }
      
      if (!user) {
        // Create new user from Google One Tap
        const userData = {
          username: payload.email?.split('@')[0] || 'user',
          email: payload.email || '',
          firstName: payload.given_name || '',
          lastName: payload.family_name || '',
          googleId: payload.sub,
          profileImageUrl: payload.picture?.replace('s96-c', 's200-c'),
          authProvider: 'google' as const,
          isVerified: true,
          profileCompleted: false,
        };
        
        user = await storage.createUser(userData);
        console.log('Created new user from Google One Tap:', user.id);
      }

      // Create session for the authenticated user
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileCompleted: user.profileCompleted
      };

      console.log('Google One Tap session created for user:', user.id);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileCompleted: user.profileCompleted,
          profileImageUrl: user.profileImageUrl,
          authProvider: user.authProvider
        }
      });
      
    } catch (error) {
      console.error('Google One Tap verification failed:', error);
      res.status(401).json({ 
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Note: /api/auth/status endpoint is handled in routes.ts to support both JWT and session auth

  // Logout route (destroys session and clears cookies)
  app.post("/api/auth/logout", (req, res) => {
    // Clear session user data
    if (req.session) {
      (req.session as any).user = null;
    }
    
    // Also clear passport session if it exists
    req.logout((err) => {
      if (err) {
        console.error("Passport logout error:", err);
      }
      
      // Destroy session completely
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destruction error:", sessionErr);
          return res.status(500).json({ message: "Error logging out" });
        }
        
        // Clear session cookie
        res.clearCookie('pathak.session');
        res.json({ message: "Logged out successfully" });
      });
    });
  });
}