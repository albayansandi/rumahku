import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { UserProfile, saveStoredUser } from './authStore';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// In-memory token cache (never stored in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export function getCachedAccessToken(): string | null {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null, expiresInSeconds = 3600) {
  cachedAccessToken = token;
  tokenExpiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
}

/**
 * Perform Google Sign-In with Google Account Chooser forced via prompt=select_account
 */
export async function signInWithGoogle(forceAccountChooser = true): Promise<{
  user: UserProfile;
  accessToken: string;
}> {
  const provider = new GoogleAuthProvider();
  
  // Scopes requested
  provider.addScope('https://www.googleapis.com/auth/drive.appdata');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');

  // MANDATORY: prompt='select_account consent' forces Google Account Chooser AND scope consent
  if (forceAccountChooser) {
    provider.setCustomParameters({
      prompt: 'select_account consent',
    });
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    setCachedAccessToken(accessToken, 3600);

    const userProfile: UserProfile = {
      id: result.user.uid,
      name: result.user.displayName || 'Pengguna Google',
      email: result.user.email || '',
      photoUrl: result.user.photoURL || undefined,
      isGuest: false,
      isDriveConnected: true,
      googleAccessToken: accessToken,
    };

    saveStoredUser(userProfile);
    return { user: userProfile, accessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);

    // If popup closed by user
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Proses login dibatalkan oleh pengguna.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Permintaan login dibatalkan karena ada proses lain.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Jendela popup diblokir peramban. Izinkan popup untuk login dengan Google.');
    }

    throw new Error(error.message || 'Gagal masuk dengan Google.');
  }
}

/**
 * Switch Google Account without deleting local data or Drive data
 */
export async function switchGoogleAccount(): Promise<{
  user: UserProfile;
  accessToken: string;
}> {
  // 1. Sign out current session
  await signOut(auth);
  setCachedAccessToken(null);

  // 2. Immediately trigger sign-in with forceAccountChooser = true
  return await signInWithGoogle(true);
}

/**
 * Sign out user safely without clearing IndexedDB local database
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  setCachedAccessToken(null);
}

/**
 * Subscribe to Auth State changes
 */
export function initAuthListener(
  onUserChanged: (user: User | null, token: string | null) => void
) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const token = getCachedAccessToken();
      onUserChanged(firebaseUser, token);
    } else {
      setCachedAccessToken(null);
      onUserChanged(null, null);
    }
  });
}
