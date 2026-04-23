'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onIdTokenChanged, 
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Automatically sync the fresh token into the cookie
        const token = await currentUser.getIdToken();
        Cookies.set('session', token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
        setUser(currentUser);
      } else {
        Cookies.remove('session');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    import('js-cookie').then((Cookies) => {
      Cookies.default.remove('session');
    });
    await firebaseSignOut(auth);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
