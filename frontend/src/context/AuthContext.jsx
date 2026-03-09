import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToAuthChanges } from '../services/auth';
import { getUserProfile } from '../services/db';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user) => {
    if (!user) { setUserProfile(null); return; }
    
    // Get custom claims from auth token
    const tokenResult = await user.getIdTokenResult();
    const claims = {
      isAdmin: tokenResult.claims.admin === true || tokenResult.claims.superAdmin === true,
      __isSuperAdmin: tokenResult.claims.superAdmin === true
    };
    
    const { data } = await getUserProfile(user.uid);
    // Merge firestore data with auth claims
    setUserProfile(data ? { ...data, ...claims } : null);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      await fetchProfile(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (currentUser) await fetchProfile(currentUser);
  }, [currentUser, fetchProfile]);

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

