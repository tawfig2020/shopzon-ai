import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const db = getFirestore();
const storage = getStorage();

export const userService = {
  async createUserProfile(user, additionalData = {}) {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const { email, displayName, photoURL } = user;
      const createdAt = new Date();

      try {
        await setDoc(userRef, {
          email,
          displayName,
          photoURL,
          createdAt,
          ...additionalData,
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    }

    return userRef;
  },

  async updateUserProfile(userId, data) {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async getUserProfile(userId) {
    if (!userId) return null;

    const userRef = doc(db, 'users', userId);
    try {
      const snapshot = await getDoc(userRef);
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async uploadProfileImage(userId, file) {
    if (!userId || !file) return null;

    const storageRef = ref(storage, `users/${userId}/profile-image`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await this.updateUserProfile(userId, { photoURL: downloadURL });
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },
};
