import React, { createContext, useContext, useEffect, useState } from 'react';

// 🚨 MANTENHA: Importa o tipo User diretamente
import { User } from 'firebase/auth'; 

import { auth } from "../firebaseConfig";

interface AuthContextType {
  currentUser: User | null; // CORRIGIDO AQUI
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 🚨 CORREÇÃO FINAL AQUI
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};