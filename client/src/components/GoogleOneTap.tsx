import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTap() {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Don't show if user is already authenticated
    if (isAuthenticated) return;

    // Don't show if already shown in this session
    if (sessionStorage.getItem('googleOneTapShown')) return;

    // Load Google One Tap script
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGoogleLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isGoogleLoaded || isAuthenticated || hasShownPrompt) return;

    // Show One Tap after 5-6 seconds of browsing
    const timer = setTimeout(() => {
      initializeGoogleOneTap();
    }, 5500); // 5.5 seconds

    return () => clearTimeout(timer);
  }, [isGoogleLoaded, isAuthenticated, hasShownPrompt]);

  const initializeGoogleOneTap = () => {
    if (!window.google?.accounts?.id) {
      console.log('Google One Tap not available - script not loaded');
      return;
    }

    try {
      // Check if we're in a supported environment (HTTPS, no iframe restrictions)
      const isHTTPS = window.location.protocol === 'https:';
      const isInFrame = window !== window.top;
      
      if (!isHTTPS && window.location.hostname !== 'localhost') {
        console.log('Google One Tap requires HTTPS in production');
        return;
      }
      
      if (isInFrame) {
        console.log('Google One Tap blocked - running in iframe');
        return;
      }

      console.log('Initializing Google One Tap...');
      
      window.google.accounts.id.initialize({
        client_id: '1089622312459-92mclsbhh3g05tpm4sflpcjdi8958t80.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        use_fedcm_for_prompt: true,
      });

      // Show the One Tap prompt with enhanced error handling
      window.google.accounts.id.prompt((notification) => {
        const reason = notification.isNotDisplayed() 
          ? notification.getNotDisplayedReason() 
          : notification.isSkippedMoment() 
          ? notification.getSkippedReason()
          : notification.isDismissedMoment()
          ? notification.getDismissedReason()
          : 'unknown';
          
        console.log('Google One Tap notification:', {
          displayed: !notification.isNotDisplayed(),
          skipped: notification.isSkippedMoment(),
          dismissed: notification.isDismissedMoment(),
          reason: reason
        });
        
        // If One Tap fails, users can still use the manual Google OAuth button
        if (notification.isNotDisplayed()) {
          console.log('One Tap not displayed, fallback to manual Google OAuth available');
        }
      });

      setHasShownPrompt(true);
      sessionStorage.setItem('googleOneTapShown', 'true');
      console.log('Google One Tap initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google One Tap:', error);
      console.log('Manual Google OAuth still available as fallback');
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Google One Tap credential received, verifying...');
      
      // Send the Google token to our backend for verification and session creation
      const authResponse = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session handling
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        console.error('Google One Tap auth failed:', errorData);
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await authResponse.json();
      console.log('Google One Tap auth successful:', { userId: data.user?.id, email: data.user?.email });
      
      // Update auth context with session-based user
      login(data.user);

      toast({
        title: 'Welcome back!',
        description: `Signed in as ${data.user.email}`,
        duration: 3000,
      });

      // Disable auto-select for future visits to avoid spam
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      // Redirect based on user profile completion status
      if (!data.user.profileCompleted) {
        window.location.href = '/complete-profile?googleAuth=true';
      } else {
        window.location.href = '/account?googleAuth=success';
      }

    } catch (error: any) {
      console.error('Google One Tap login failed:', error);
      toast({
        title: 'Sign-in failed',
        description: 'Unable to sign in with Google. Please try the regular Google sign-in button.',
        variant: 'destructive',
      });
    }
  };

  // This component doesn't render anything visible
  return null;
}