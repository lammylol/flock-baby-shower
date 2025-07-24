// Purpose: Create a custom hook to use the AuthContext.
// This hook will be used to access the user and set boundaries for use.

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Safe hook that ensures user is authenticated and not null
const useAuthenticatedUser = () => {
  const { user, userIsAuthenticated, isAuthLoading, authChecked } =
    useAuthContext();

  if (isAuthLoading || !authChecked) {
    throw new Error(
      'Authentication is still loading. Wait for auth to complete before accessing user.',
    );
  }

  if (!userIsAuthenticated || !user) {
    throw new Error(
      'User is not authenticated. Ensure user is logged in before accessing this functionality.',
    );
  }

  return user;
};

export default useAuthContext;
export { useAuthenticatedUser };
