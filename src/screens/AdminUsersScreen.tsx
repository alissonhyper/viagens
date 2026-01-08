import React, { useEffect, useMemo, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import { db } from '../../firebaseConfig';
import { PermissionKey, useAuth } from '../AuthContext';

type UserRow = {
  uid: string;
  email: string;
  active: boolean;
  permissions: PermissionKey[];
};

const APP_USERS_COLLECTION = 'appUsers';

type AccessProfile = 'TRAY' | 'TRAY_HISTORY' | 'ALL' | 'ADMIN';

function toAccessProfile(perms: PermissionKey[]): AccessProfile {
  if (perms.includes('admin')) return 'ADMIN';
  if (perms.includes('all')) return 'ALL';
  if (perms.includes('history')) return 'TRAY_HISTORY';
  return 'TRAY';
}

function fromAccessProfile(profile: AccessProfile): PermissionKey[] {
  switch (profile) {
    case 'ADMIN':
      return ['admin', 'all'];
    case 'ALL':
      return ['all'];
    case 'TRAY_HISTORY':
      return ['tray', 'history'];
    case 'TRAY':
    default:
      return ['tray'];
  }
}

export const AdminUsersScreen: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;

    const ref = db.collection(APP_USERS_COLLECTION).orderBy('email');
    const unsub = ref.onSnapshot(
      (snap) => {
        const rows: UserRow[] = snap.docs.map((d) => {
          const data = (d.data() ?? {}) as any;
          return {
            uid: d.id,
            email: (data.email ?? '').toString(),
            active: Boolean(data.active),
            permissions: Array.isArray(data.permissions) ? data.permissions : (['tray'] as PermissionKey[]),
          };
        });
        setUsers(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Falha ao carregar usuários.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const updateUser = async (uid: string, patch: Partial<UserRow>) => {
    setError('');
    try {
      await db.collection(APP_USERS_COLLECTION).doc(uid).set(
        {
          ...patch,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error(err);
      setError('Não foi possível salvar as permissões.');
    }
  };

  const content = useMemo(() => {
    if (!isAdmin) {
      return (
        <div className="p-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
            Você não tem permissão para acessar esta área.
          </div>
        </div>
      );
    }

    if (loading) {
      return <div className="p-6 text-white/70">Carregando usuários…</div>;
    }

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">Administração de usuários</h2>
            <p className="text-sm text-white/60">
              Ajuste quais abas cada usuário pode acessar.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/25 bg-red-600/10 text-red-200 px-4 py-3">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[44%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="text-left px-4 py-3 font-bold">E-mail</th>
                <th className="text-left px-4 py-3 font-bold">Perfil</th>
                <th className="text-left px-4 py-3 font-bold">Permissões</th>
                <th className="text-center px-4 py-3 font-bold">Ativo</th>
              </tr>
            </thead>

            <tbody className="bg-black/10">
              {users.map((u) => {
                const profile = toAccessProfile(u.permissions);
                
                const isMe = currentUser?.uid === u.uid; 

                return (
                  <tr key={u.uid} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white/90 truncate">{u.email || u.uid}</td>

                    <td className="px-4 py-3">
                      <select
  value={profile}
  disabled={isMe}
  onChange={(e) => {
    if (isMe) return; // segurança extra
    const next = e.target.value as AccessProfile;
    updateUser(u.uid, { permissions: fromAccessProfile(next) });
  }}
  className={`w-full rounded-lg border px-3 py-2 outline-none
    bg-[#1A202C] text-white border-white/10
    ${isMe ? 'opacity-60 cursor-not-allowed' : ''}`}
>
  <option value="TRAY" className="bg-[#1A202C] text-white">Somente Bandeja</option>
  <option value="TRAY_HISTORY" className="bg-[#1A202C] text-white">Bandeja + Histórico</option>
  <option value="ALL" className="bg-[#1A202C] text-white">Acesso Total (todas as abas)</option>
  <option value="ADMIN" className="bg-[#1A202C] text-white">Administrador</option>
</select>

{isMe && (
  <div className="text-[10px] text-amber-300 mt-1 font-bold">
    Sua conta (Sempre admin)
  </div>
)}
                    </td>

                    <td className="px-4 py-3 text-white/70 truncate">
                      {u.permissions.join(', ')}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
  type="checkbox"
  checked={u.active}
  disabled={isMe}
  onChange={(e) => {
    if (isMe) return; // segurança extra
    updateUser(u.uid, { active: e.target.checked });
  }}
/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [error, isAdmin, loading, users, currentUser]);

  return <div className="min-h-screen">{content}</div>;
};
