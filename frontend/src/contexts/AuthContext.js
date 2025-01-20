import React, { createContext, useState, useContext, useEffect } from 'react';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import PropTypes from 'prop-types';

import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Google Sign In
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, provider);

      // You can access additional user info
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;

      // The signed-in user info
      const user = result.user;
      setError('');
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setError('');
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setError('');
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setError('');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      setError('');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function updateProfile(profile) {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.updateProfile(profile);
        setCurrentUser({ ...user });
        setError('');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Test authentication state
  async function testAuthState() {
    try {
      const testEmail = 'test@example.com';
      const testPassword = 'testPassword123';

      // Test signup
      console.log('Testing signup...');
      await signup(testEmail, testPassword);

      // Test login
      console.log('Testing login...');
      await login(testEmail, testPassword);

      // Test Google Sign In
      console.log('Testing Google Sign In...');
      await signInWithGoogle();

      // Test profile update
      console.log('Testing profile update...');
      await updateProfile({ displayName: 'Test User' });

      // Test password reset
      console.log('Testing password reset...');
      await resetPassword(testEmail);

      // Test logout
      console.log('Testing logout...');
      await logout();

      return true;
    } catch (err) {
      console.error('Auth test failed:', err);
      return false;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateProfile,
    signInWithGoogle,
    testAuthState,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
