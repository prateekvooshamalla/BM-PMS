import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage, auth } from './firebase';

export async function uploadFloorPlan(file: File, projectId?: string, onProgress?: (pct: number) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be signed in');
  const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
  const resolvedProjectId = projectId || 'draft';
  const path = `projects/${resolvedProjectId}/floorplans/${uid}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'application/octet-stream' });
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', (snapshot) => {
      const pct = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
      onProgress?.(pct);
    }, reject, () => resolve());
  });
  const downloadUrl = await getDownloadURL(storageRef);
  return { path, downloadUrl };
}
