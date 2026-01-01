import { User } from '@/types';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

/**
 * Initialize Google Sign-In
 */
export function initializeGoogleAuth(onSuccess: (response: GoogleAuthResponse) => void) {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env');
    return;
  }

  // Load Google Identity Services script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onSuccess,
      });
    }
  };
  document.head.appendChild(script);
}

/**
 * Render Google Sign-In button
 */
export function renderGoogleButton(elementId: string) {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured');
    return;
  }

  if (window.google && window.google.accounts) {
    window.google.accounts.id.renderButton(
      document.getElementById(elementId)!,
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
      }
    );
  }
}

/**
 * Decode JWT token to get user info
 */
export function decodeGoogleCredential(credential: string): GoogleUserInfo {
  const base64Url = credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );

  return JSON.parse(jsonPayload);
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleAuthResponse) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme?: string; size?: string; width?: string | number }) => void;
          prompt: () => void;
        };
      };
    };
  }
}