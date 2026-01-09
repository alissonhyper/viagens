import React, { useEffect, useMemo, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { firestoreService, Viagem } from '../firestoreService';
import TrayScreen from './TrayScreen';
import { AdminUsersScreen } from './AdminUsersScreen';


// Componente simples para exibir uma viagem
const ViagemCard: React.FC<{ viagem: Viagem }> = ({ viagem }) => (
  <div className="p-4 mb-3 border rounded shadow-md bg-white dark:bg-gray-700 dark:border-gray-600">
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{viagem.destino}</h3>
    <p className="text-gray-600 dark:text-gray-300">
      De: {viagem.data_inicio} até: {viagem.data_fim}
    </p>
    <p className="text-sm text-indigo-600 dark:text-indigo-400">
      Orçamento: R$ {viagem.orcamento.toFixed(2)} | Criado por: {viagem.autor_email}
    </p>
  </div>
);

// Placeholder para Bandeja (troque depois pela sua tela real)
const TrayPlaceholder: React.FC = () => (
  <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
    <p className="text-gray-700 dark:text-gray-200 font-semibold">Bandeja</p>
    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
      Conteúdo da bandeja entra aqui (sua tela real).
    </p>
  </div>
);

// Placeholder para Admin (troque depois por AdminUsersScreen)
const AdminPlaceholder: React.FC = () => (
  <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
    <p className="text-gray-700 dark:text-gray-200 font-semibold">Admin</p>
    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
      Aqui você vai gerenciar permissões (ativar/desativar, perfis).
    </p>
  </div>
);

type TabKey = 'tray' | 'history' | 'admin';

const DashboardScreen: React.FC = () => {
  const authContext = useContext(AuthContext);

  // Estes campos precisam existir no AuthContext atualizado:
  // currentUser, signOut, profile, can, isAdmin
  const { currentUser, signOut, profile, can, isAdmin } = authContext as any;

  const [activeTab, setActiveTab] = useState<TabKey>('tray');

  const tabs = useMemo(
    () => [
      { key: 'tray' as const, label: 'Bandeja', requires: 'tray' as const },
      { key: 'history' as const, label: 'Histórico', requires: 'history' as const },
      { key: 'admin' as const, label: 'Admin', requires: 'admin' as const },
    ],
    []
  );

  const visibleTabs = useMemo(() => tabs.filter((t) => can?.(t.requires)), [tabs, can]);

  // Garante que a aba ativa sempre exista nas permitidas
  useEffect(() => {
    if (!visibleTabs.length) return;

    const exists = visibleTabs.some((t) => t.key === activeTab);
    if (!exists) setActiveTab(visibleTabs[0].key);
  }, [visibleTabs, activeTab]);

  // Se o usuário estiver inativo (bloqueado), barra o acesso
  if (profile && profile.active === false) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          Seu acesso está desativado. Fale com o administrador.
        </div>

        <button
          onClick={signOut}
          className="mt-4 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Sair
        </button>
      </div>
    );
  }

  // ===== Conteúdo do Histórico (seu conteúdo atual) =====
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Só carrega viagens se estiver na aba Histórico e tiver permissão
    if (activeTab !== 'history') return;
    if (!can?.('history')) return;

    setIsLoading(true);

    const unsubscribe = firestoreService.subscribeToViagens(
      (viagensAtualizadas) => {
        setViagens(viagensAtualizadas);
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar viagens em tempo real:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab, can]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Programação de Viagem
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentUser?.email ?? 'Usuário autenticado'} {isAdmin ? '(Admin)' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={signOut}
            className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* MENU (ABAS) */}
      <nav className="mb-6 flex flex-wrap gap-2">
        {visibleTabs.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition border
                ${
                  active
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* CONTEÚDO POR ABA */}
      {activeTab === 'tray' && (
        can?.('tray') ? (
          <TrayScreen />
        ) : (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            Você não tem permissão para acessar a Bandeja.
          </div>
        )
      )}

      {activeTab === 'history' && (
        can?.('history') ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Histórico Colaborativo (Viagens: {viagens.length})
            </h2>

            {isLoading && <p className="text-blue-500">Carregando viagens em tempo real...</p>}

            {!isLoading && viagens.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma viagem encontrada.
              </p>
            )}

            <div className="space-y-4">
              {viagens.map((viagem) => (
                <ViagemCard key={viagem.id} viagem={viagem} />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            Você não tem permissão para acessar o Histórico.
          </div>
        )
      )}

      {activeTab === 'admin' && (
        can?.('admin') ? (
          <AdminPlaceholder />
        ) : (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            Você não tem permissão para acessar o Admin.
          </div>
        )
      )}
    </div>
  );
};

export default DashboardScreen;