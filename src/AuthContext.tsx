// src/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';

// Importa User e signOut (função de deslogar)
import { User, signOut as firebaseSignOut } from 'firebase/auth'; 

import { auth } from "../firebaseConfig";

// 1. ATUALIZAÇÃO DA INTERFACE: Adiciona a função signOut
interface AuthContextType {
  currentUser: User | null; 
  loading: boolean;
  signOut: () => Promise<void>; // <-- ADICIONADO
}

// 2. ATUALIZAÇÃO DO VALOR PADRÃO: Inclui a implementação dummy de signOut
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signOut: async () => {}, // <-- ADICIONADO (Implementação vazia)
});

// useAuth já está obsoleto, use useContext(AuthContext) diretamente no Dashboard
export const useAuth = () => useContext(AuthContext); 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true);

  // 3. ATUALIZAÇÃO DA FUNÇÃO: Implementa o sign out real do Firebase
  const signOut = () => {
      return firebaseSignOut(auth); // Função do Firebase real
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signOut, // <-- ADICIONADO ao objeto 'value'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};