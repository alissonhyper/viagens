import React, { useState } from 'react';
import { authService } from './authService';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // NOVO: Estado para alternar entre Login (false) e Cadastro (true)
  const [isSigningUp, setIsSigningUp] = useState(false); 

  // FUNÇÃO UNIFICADA PARA TRATAR LOGIN E CADASTRO
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação de senha mínima para o cadastro (Firebase exige >= 6)
    if (isSigningUp && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres para o cadastro.');
      return;
    }

    setLoading(true);

    try {
      if (isSigningUp) {
        // CHAMA A FUNÇÃO DE CADASTRO DO authService
        await authService.signup(email, password);
      } else {
        // CHAMA A FUNÇÃO DE LOGIN DO authService
        await authService.login(email, password);
      }
      // O redirecionamento é automático via AuthContext no App.tsx
    } catch (err: any) {
      // Mensagem de erro mais útil
      const message = isSigningUp
        ? 'Falha no Cadastro. Este e-mail pode já estar em uso ou a senha é muito fraca.'
        : 'Falha no Login. Verifique suas credenciais.';

      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-200">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-800 uppercase tracking-tight">Programação de Viagem</h1>
          <p className="text-gray-500 text-sm mt-2">Acesso Restrito</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border border-red-200">
            {error}
          </div>
        )}

        {/* MUDANÇA: O FORMULÁRIO CHAMA AGORA handleAuth */}
        <form onSubmit={handleAuth} className="space-y-4"> 
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-wider text-white shadow-lg transition-all ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 transform active:scale-95'
            }`}
          >
            {/* MUDANÇA: TEXTO DO BOTÃO DINÂMICO */}
            {loading 
              ? (isSigningUp ? 'Cadastrando...' : 'Entrando...') 
              : (isSigningUp ? 'Criar Conta' : 'Acessar Sistema') 
            }
          </button>
        </form>

        {/* NOVO BLOCO: LINK PARA ALTERNAR LOGIN/CADASTRO */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            {isSigningUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button
              type="button"
              onClick={() => {
                // Alterna o estado e limpa o erro/campos para uma nova tentativa
                setIsSigningUp(!isSigningUp);
                setError(''); 
                setEmail('');
                setPassword('');
              }}
              className="text-blue-600 hover:text-blue-700 font-bold ml-1 transition-colors"
            >
              {isSigningUp ? 'Fazer Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
        {/* FIM DO BLOCO NOVO */}

        <div className="text-center text-xs text-gray-400 font-bold uppercase mt-6">
          &copy; {new Date().getFullYear()} Programação de Viagem
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;