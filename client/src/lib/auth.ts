import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  role: 'customer' | 'admin' | 'super_admin';
  email?: string;
  phone?: string;
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
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiRequest('POST', '/api/auth/login', credentials);
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await apiRequest('POST', '/api/auth/register', userData);
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function sendOTP(phone: string): Promise<void> {
  await apiRequest('POST', '/api/auth/send-otp', { phone });
}

export async function verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
  const response = await apiRequest('POST', '/api/auth/verify-otp', { phone, otp });
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredToken(): string | null {
  return localStorage.getItem('token');
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function hasRole(role: string): boolean {
  const user = getStoredUser();
  return user?.role === role;
}
