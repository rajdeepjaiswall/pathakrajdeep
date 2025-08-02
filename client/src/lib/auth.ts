import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  role: 'customer' | 'admin' | 'super_admin';
  email?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  area?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  latitude?: string;
  longitude?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  latitude?: string;
  longitude?: string;
  role?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session management
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Invalid credentials');
  }

  const data = await response.json();
  
  // Store user data in localStorage for UI state
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session management
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  const data = await response.json();
  
  // Store user data in localStorage for UI state
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function sendOTP(phone: string): Promise<void> {
  await apiRequest('/api/auth/send-otp', 'POST', { phone });
}

export async function verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session management
    body: JSON.stringify({ phone, otp }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'OTP verification failed' }));
    throw new Error(error.message || 'OTP verification failed');
  }

  const data = await response.json();
  
  // Store user data in localStorage for UI state
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function logout(): Promise<void> {
  // Clear localStorage first
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Also call server logout to clear cookie and session
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include', // Include cookies in the request
    });
  } catch (error) {
    console.log('Server logout failed, but localStorage cleared');
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('token');
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Function to get user data from server for cookie-authenticated users (Google OAuth)
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/status', {
      credentials: 'include', // Include cookies
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.isAuthenticated && data.user) {
      // For Google OAuth users, store user data locally for consistency
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  // Check localStorage token first
  if (getStoredToken()) {
    return true;
  }
  
  // Check if cookie-based authentication is present (for Google OAuth users)
  const cookies = document.cookie.split(';');
  const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
  
  return isLoggedInCookie ? isLoggedInCookie.split('=')[1] === 'true' : false;
}

export function hasRole(role: string): boolean {
  const user = getStoredUser();
  return user?.role === role;
}
