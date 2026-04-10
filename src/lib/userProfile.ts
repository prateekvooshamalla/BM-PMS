import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

export function watchUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    },
    () => callback(null),
  );
}
