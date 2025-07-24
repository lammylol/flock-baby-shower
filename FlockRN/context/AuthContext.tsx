// Purpose: Create a context for user authentication. This context will be used to provide user
// authentication information to the entire application.
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/firebase/firebaseConfig';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { userService } from '@/services/userService';
import { UserProfileResponse } from '@shared/types/firebaseTypes';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileResponse | null;
  userIsAuthenticated: boolean;
  isAuthLoading: boolean;
  authChecked: boolean;
  signOut: typeof signOut;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  userIsAuthenticated: false,
  isAuthLoading: true,
  authChecked: false,
  signOut: () => Promise.resolve(),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsAuthLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setIsAuthLoading(true);

      if (user) {
        try {
          const profile = await userService.getUser(user.uid);
          if (isMounted) {
            setUser(user);
            setUserProfile(profile);
            setUserIsAuthenticated(true);
          }
        } catch (err) {
          console.error('Error loading profile:', err);
          if (isMounted) {
            setUser(user);
            setUserProfile(null);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        userIsAuthenticated,
        isAuthLoading,
        authChecked,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export for use in hooks
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for use in useAuthContext
export { AuthContext };
