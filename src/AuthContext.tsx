import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { auth, db } from '../firebaseConfig';

export type PermissionKey = 'tray' | 'history' | 'admin' | 'all';

export type AppUserProfile = {
  uid: string;
  email: string;
  active: boolean;
  permissions: PermissionKey[];
};

interface AuthContextType {
  currentUser: firebase.User | null;
  profile: AppUserProfile | null;
  loading: boolean;

  signOut: () => Promise<void>;

  // checagem de permissão
  can: (perm: PermissionKey) => boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  profile: null,
  loading: true,

  signOut: async () => {},

  can: () => false,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

const APP_USERS_COLLECTION = 'appUsers';

// defaults quando o usuário não tem doc ainda
const DEFAULT_ACTIVE = true;
const DEFAULT_PERMISSIONS: PermissionKey[] = ['tray'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const loading = loadingAuth || loadingProfile;

  const signOut = () => auth.signOut();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);

      // limpa listener anterior
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!user) {
        setProfile(null);
        setLoadingAuth(false);
        setLoadingProfile(false);
        return;
      }

      setLoadingAuth(false);
      setLoadingProfile(true);

      const ref = db.collection(APP_USERS_COLLECTION).doc(user.uid);

      unsubscribeProfile = ref.onSnapshot(
        async (snap) => {
          try {
            // Se não existir perfil no Firestore ainda, cria padrão (tray)
            if (!snap.exists) {
              await ref.set(
                {
                  email: user.email ?? '',
                  active: DEFAULT_ACTIVE,
                  permissions: DEFAULT_PERMISSIONS,
                  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
              return; // vai disparar snapshot novamente
            }

            const data = (snap.data() ?? {}) as any;

            const p: AppUserProfile = {
              uid: user.uid,
              email: (data.email ?? user.email ?? '').toString(),
              active: Boolean(data.active),
              permissions: Array.isArray(data.permissions) ? data.permissions : DEFAULT_PERMISSIONS,
            };

            setProfile(p);
          } finally {
            setLoadingProfile(false);
          }
        },
        (err) => {
          console.error('Erro ao carregar perfil appUsers:', err);
          setProfile(null);
          setLoadingProfile(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const can = useMemo(() => {
    return (perm: PermissionKey) => {
      if (!profile?.active) return false;
      const perms = profile.permissions ?? [];

      if (perm === 'all') return perms.includes('all');
      if (perm === 'admin') return perms.includes('admin');

      // para permissões normais: all libera tudo
      return perms.includes('all') || perms.includes(perm);
    };
  }, [profile]);

  const isAdmin = Boolean(profile?.active && profile?.permissions?.includes('admin'));

  const value: AuthContextType = {
    currentUser,
    profile,
    loading,
    signOut,
    can,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};