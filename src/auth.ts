import { User, onAuthStateChanged, signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function ensureAnonymousUser(nickname: string): Promise<User> {
  if (!nickname.trim()) {
    throw new Error('Nickname is required');
  }
  const currentUser = auth.currentUser;
  if (!currentUser) {
    const cred = await signInAnonymously(auth);
    await persistNickname(cred.user, nickname);
    return cred.user;
  }
  await persistNickname(currentUser, nickname);
  return currentUser;
}

export async function persistNickname(user: User, nickname: string) {
  await updateProfile(user, { displayName: nickname });
  await setDoc(
    doc(db, 'users', user.uid),
    {
      nickname: nickname.trim(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
