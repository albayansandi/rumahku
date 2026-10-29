export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  isGuest: boolean;
  isDriveConnected: boolean;
  googleAccessToken?: string | null;
}

const AUTH_STORAGE_KEY = 'rumahku_user_auth';

export const GUEST_USER: UserProfile = {
  id: 'guest_user',
  name: 'Tamu RUMAHKU',
  email: '',
  photoUrl: '',
  isGuest: true,
  isDriveConnected: false,
  googleAccessToken: null,
};

export function getGuestUser(): UserProfile {
  return { ...GUEST_USER };
}

export function getStoredUser(): UserProfile {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure access token is never persisted in localStorage per guidelines
      return {
        ...parsed,
        googleAccessToken: null,
      };
    }
  } catch (e) {
    console.error('Error reading auth state', e);
  }

  // Default Guest user
  return getGuestUser();
}

export function saveStoredUser(user: UserProfile) {
  try {
    // Exclude sensitive token before saving metadata to storage
    const { googleAccessToken, ...safeMetadata } = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeMetadata));
  } catch (e) {
    console.error('Error saving auth state', e);
  }
}

export function clearStoredUser() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing auth state', e);
  }
}
