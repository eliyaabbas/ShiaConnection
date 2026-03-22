import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a user's avatar image to Firebase Storage.
 * @param {string} uid - The user's UID
 * @param {File} file - The image File object
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {{ url: string|null, error: string|null }}
 */
export const uploadAvatar = (uid, file, onProgress) => {
  return new Promise((resolve) => {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const storageRef = ref(storage, `avatars/${uid}/avatar.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          resolve({ url: null, error: error.message });
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, error: null });
        }
      );
    } catch (error) {
      resolve({ url: null, error: error.message });
    }
  });
};

/**
 * Upload a post media file (image/video).
 * @param {string} postId - Temporary/final post ID
 * @param {File} file - Media file
 * @param {function} onProgress - Optional progress callback
 */
export const uploadPostMedia = (uid, postId, file, onProgress) => {
  return new Promise((resolve) => {
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `posts/${uid}/${postId}.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => resolve({ url: null, error: error.message }),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, error: null });
        }
      );
    } catch (error) {
      resolve({ url: null, error: error.message });
    }
  });
};

/**
 * Upload a user's resume PDF to Firebase Storage.
 * @param {string} uid - The user's UID
 * @param {File} file - The PDF File object
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {{ url: string|null, error: string|null }}
 */
export const uploadResume = (uid, file, onProgress) => {
  return new Promise((resolve) => {
    try {
      const storageRef = ref(storage, `resumes/${uid}/resume.pdf`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type || 'application/pdf' });
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => resolve({ url: null, error: error.message }),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, error: null });
        }
      );
    } catch (error) {
      resolve({ url: null, error: error.message });
    }
  });
};
