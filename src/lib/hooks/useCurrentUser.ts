import { useCallback, useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';

interface UserData {
  id: number;
  userId?: number;
  role?: string;
  iat?: number;
  exp?: number;
}

export function useCurrentUser() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentUser = useCallback(() => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        setUserData(null);
        setIsLoading(false);
        return null;
      }

      const decoded = jwt.decode(token) as UserData;

      if (!decoded || (!decoded.id && !decoded.userId)) {
        setUserData(null);
        setIsLoading(false);
        return null;
      }

      const userData = {
        id: decoded.userId || decoded.id,
        role: decoded.role,
        exp: decoded.exp
      };

      setUserData(userData);
      setIsLoading(false);
      return userData;
    } catch (error) {
      console.error('Error decoding token:', error);
      setUserData(null);
      setIsLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const isAuthenticated = Boolean(userData?.id);

  return {
    user: userData,
    userId: userData?.id,
    role: userData?.role,
    isAuthenticated,
    isLoading,
    getCurrentUser,
  };
}
