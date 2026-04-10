import {
  ConfirmationResult,
  RecaptchaVerifier,
  User,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

let verifier: RecaptchaVerifier | null = null;

export function getOrCreateRecaptcha(containerId: string) {
  if (verifier) return verifier;
  verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
  });
  return verifier;
}

export function clearRecaptcha() {
  verifier?.clear();
  verifier = null;
}

export async function requestOtp(phoneNumber: string, containerId = 'recaptcha-container'): Promise<ConfirmationResult> {
  await setPersistence(auth, browserLocalPersistence);
  const appVerifier = getOrCreateRecaptcha(containerId);
  try {
    await appVerifier.render();
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  } catch (error) {
    clearRecaptcha();
    throw error;
  }
}

export async function ensureUserProfile(user: User) {
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  const current = existing.exists() ? existing.data() : null;
  await setDoc(
    ref,
    {
      uid: user.uid,
      phoneNumber: user.phoneNumber || '',
      role: current?.role || 'owner',
      status: current?.status || 'active',
      updatedAt: serverTimestamp(),
      createdAt: current?.createdAt || serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function verifyOtp(confirmation: ConfirmationResult, code: string) {
  const credential = await confirmation.confirm(code);
  if (credential.user) {
    await ensureUserProfile(credential.user);
  }
  clearRecaptcha();
  return credential;
}

export async function logout() {
  clearRecaptcha();
  return signOut(auth);
}

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
