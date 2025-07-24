// Created At: 2021-09-12 11:00:00
// This is the useAuth hook that will be used to authenticate users.

import { useEffect, useState } from 'react';
import { auth } from '@/firebase/firebaseConfig';
import { User, onAuthStateChanged, signOut } from '@firebase/auth';
import { userService } from '@/services/userService';
import { UserProfileResponse } from '@shared/types/firebaseTypes';

export default function useAuth() {
  // State for storing the user
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  // State for tracking whether the user is authenticated
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsAuthLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setIsAuthLoading(true);
      if (user) {
        try {
          const userProfile = await userService.getUser(user.uid);
          if (isMounted) {
            setUserProfile(userProfile);
            setUser(user);
            setUserIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          if (isMounted) {
            setUserProfile(null);
            setUser(user);
            setUserIsAuthenticated(true);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setUserProfile(null);
          setUserIsAuthenticated(false);
        }
      }
      if (isMounted) {
        setIsAuthLoading(false);
        setAuthChecked(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    user,
    userProfile,
    userIsAuthenticated,
    isAuthLoading,
    setIsAuthLoading,
    signOut,
    authChecked,
  };
}
