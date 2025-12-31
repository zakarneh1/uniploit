import { User } from '@/types';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

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

  console.log('Initializing Google Auth with client ID:', GOOGLE_CLIENT_ID);

  // Check if Google Identity Services is already loaded
  if (window.google && window.google.accounts) {
    console.log('Google Identity Services already loaded, initializing directly');
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onSuccess,
    });
    return;
  }

  // Load Google Identity Services script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    console.log('Google Identity Services script loaded successfully');
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onSuccess,
      });
      console.log('Google Auth initialized successfully');
    } else {
      console.error('Google Identity Services loaded but window.google.accounts is not available');
    }
  };
  script.onerror = () => {
    console.error('Failed to load Google Identity Services script');
  };
  document.head.appendChild(script);
}

/**
 * Render Google Sign-In button
 */
export function renderGoogleButton(elementId: string, onSuccess: (response: GoogleAuthResponse) => void) {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured');
    return;
  }

  const checkGoogleAndRender = () => {
    if (window.google && window.google.accounts) {
      console.log('Rendering Google sign-in button');
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with'
        }
      );
    } else {
      console.log('Google not ready, retrying...');
      setTimeout(checkGoogleAndRender, 100);
    }
  };

  checkGoogleAndRender();
}

/**
 * Trigger Google Sign-In popup
 */
export function signInWithGoogle() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google authentication is not configured. Please contact support.');
  }

  console.log('Attempting to trigger Google sign-in');

  if (window.google && window.google.accounts) {
    console.log('Calling window.google.accounts.id.prompt()');
    window.google.accounts.id.prompt();
  } else {
    console.error('Google Identity Services not available');
    throw new Error('Google Sign-In not initialized');
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

/**
 * Convert Google user info to app User
 */
export function googleUserToAppUser(googleUser: GoogleUserInfo): Omit<User, 'id'> {
  return {
    name: googleUser.name,
    email: googleUser.email,
    university: '',
    major: '',
    graduationYear: new Date().getFullYear() + 4,
    gpaScale: 4.0,
    createdAt: new Date().toISOString(),
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleAuthResponse) => void }) => void;
          prompt: () => void;
        };
      };
    };
  }
}