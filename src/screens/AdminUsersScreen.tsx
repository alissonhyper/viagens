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

type AdminUsersScreenProps = {
  isDarkMode: boolean;
};

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({ isDarkMode }) => {
  const { isAdmin, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');

  // ✅ Theme igual ao seu app
  const themeCard = isDarkMode ? 'bg-[#2D3748] border-gray-600' : 'bg-white border-gray-200';
  const themeSubCard = isDarkMode ? 'bg-[#1A202C] border-gray-600' : 'bg-gray-50 border-gray-200';
  const themeInput = isDarkMode
    ? 'bg-[#4A5568] border-gray-600 text-white placeholder:text-gray-300'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500';
  const themeLabel = isDarkMode ? 'text-gray-300' : 'text-gray-600';

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
          <div className={`rounded-xl border p-4 ${themeCard} ${themeLabel}`}>
            Você não tem permissão para acessar esta área.
          </div>
        </div>
      );
    }

    if (loading) {
      return <div className={`p-6 ${themeLabel}`}>Carregando usuários…</div>;
    }

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={`text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Administração de usuários
            </h2>
            <p className={`text-sm ${themeLabel}`}>Ajuste quais abas cada usuário pode acessar.</p>
          </div>
        </div>

        {error && (
          <div
            className={`rounded-xl border px-4 py-3 ${
              isDarkMode
                ? 'border-red-400/30 bg-red-600/10 text-red-200'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {error}
          </div>
        )}

        <div className={`overflow-hidden rounded-xl border ${themeCard}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[760px]">
              <colgroup>
  <col className="w-[46%]" />
  <col className="w-[26%]" />
  <col className="w-[18%]" />
  <col className="w-[10%]" />
              </colgroup>

              <thead className={`${themeSubCard}`}>
                <tr>
                  <th className={`text-left px-4 py-3 font-black uppercase text-[11px] tracking-wider ${themeLabel}`}>
                    E-mail
                  </th>
                  <th className={`text-left px-4 py-3 font-black uppercase text-[11px] tracking-wider ${themeLabel}`}>
                    Perfil
                  </th>
                  <th className={`text-left px-4 py-3 font-black uppercase text-[11px] tracking-wider ${themeLabel}`}>
                    Permissões
                  </th>
                  <th className={`text-center px-2 py-3 font-black uppercase text-[11px] tracking-wider ${themeLabel}`}>
                    Ativo
                  </th>
                </tr>
              </thead>

              <tbody className={`${isDarkMode ? 'bg-[#2D3748]' : 'bg-white'}`}>
                {users.map((u) => {
                  const profile = toAccessProfile(u.permissions);

                  // ✅ robusto: trava pelo uid OU email
                  const isMe =
                    (currentUser?.uid && currentUser.uid === u.uid) ||
                    (currentUser?.email && u.email && currentUser.email.toLowerCase() === u.email.toLowerCase());

                  return (
                    <tr
                      key={u.uid}
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} ${
                        isDarkMode ? 'hover:bg-[#364152]' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <td className={`px-4 py-3 truncate font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {u.email || u.uid}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={profile}
                          disabled={isMe}
                          onChange={(e) => {
                            if (isMe) return;
                            const next = e.target.value as AccessProfile;
                            updateUser(u.uid, { permissions: fromAccessProfile(next) });
                          }}
                          className={`w-full rounded-lg border px-3 py-2 outline-none font-bold focus:ring-2 focus:ring-blue-300/30 ${themeInput} ${
                            isMe ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="TRAY" className={isDarkMode ? 'bg-[#1A202C] text-white' : 'bg-white text-gray-900'}>
                            Somente Bandeja
                          </option>
                          <option
                            value="TRAY_HISTORY"
                            className={isDarkMode ? 'bg-[#1A202C] text-white' : 'bg-white text-gray-900'}
                          >
                            Bandeja + Histórico
                          </option>
                          <option value="ALL" className={isDarkMode ? 'bg-[#1A202C] text-white' : 'bg-white text-gray-900'}>
                            Acesso Total (Tudo)
                          </option>
                          <option
                            value="ADMIN"
                            className={isDarkMode ? 'bg-[#1A202C] text-white' : 'bg-white text-gray-900'}
                          >
                            Administrador
                          </option>
                        </select>

                        {isMe && (
                          <div className={`text-[10px] mt-1 font-black ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                            Sua conta (Sempre admin)
                          </div>
                        )}
                      </td>

                      <td className={`px-4 py-3 truncate ${themeLabel} font-semibold`}>
                        {u.permissions.join(', ')}
                      </td>

                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={u.active}
                          disabled={isMe}
                          onChange={(e) => {
                            if (isMe) return;
                            updateUser(u.uid, { active: e.target.checked });
                          }}
                          className="h-4 w-4"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }, [error, isAdmin, loading, users, currentUser, isDarkMode, themeCard, themeInput, themeLabel, themeSubCard]);

  return <div className="min-h-screen">{content}</div>;
};
