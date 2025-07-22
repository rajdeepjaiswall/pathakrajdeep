import React from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

interface GoogleLoginButtonProps {
  disabled?: boolean;
  className?: string;
}

export function GoogleLoginButton({ disabled = false, className = "" }: GoogleLoginButtonProps) {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full ${className}`}
      onClick={handleGoogleLogin}
      disabled={disabled}
    >
      <FcGoogle className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  );
}