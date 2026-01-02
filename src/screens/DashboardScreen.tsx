// src/screens/DashboardScreen.tsx

import React, { useState, useEffect, useContext } from 'react';
// 1. CORREÇÃO: Importa o contexto do Auth para acessar o usuário e signOut
import { AuthContext } from '../AuthContext'; 
import { firestoreService, Viagem } from '../firestoreService'; // Caminho do Service


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


const DashboardScreen: React.FC = () => {
    // 3. CORREÇÃO: Usa useContext para pegar o user e a função signOut
    const authContext = useContext(AuthContext); 
    const { currentUser, signOut } = authContext;

    const [viagens, setViagens] = useState<Viagem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Efeito que se conecta ao Firestore quando o componente monta
    useEffect(() => {
        setIsLoading(true);
        
        // Chamada da função de inscrição no Firestore
        const unsubscribe = firestoreService.subscribeToViagens(
            (viagensAtualizadas) => {
                setViagens(viagensAtualizadas);
                setIsLoading(false);
            },
            (error) => {
                console.error("Erro ao carregar viagens em tempo real:", error);
                setIsLoading(false);
            }
        );

        // Função de limpeza: desinscreve o listener quando o componente é destruído
        return () => unsubscribe();
    }, []); 


    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Histórico Colaborativo
                </h1>
                <button 
                    onClick={signOut} 
                    className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    Sair
                </button>
            </header>
            
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Viagens ({viagens.length})
            </h2>

            {isLoading && <p className="text-blue-500">Carregando viagens em tempo real...</p>}

            {!isLoading && viagens.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma viagem encontrada. Comece a colaborar!
                </p>
            )}

            <div className="space-y-4">
                {viagens.map(viagem => (
                    <ViagemCard key={viagem.id} viagem={viagem} />
                ))}
            </div>
        </div>
    );
};

export default DashboardScreen;