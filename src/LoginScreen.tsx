import React, { useState } from 'react';
import { authService } from './authService';

type LoginVariant = 'A' | 'B' | 'C';

function resolveVariant(value: unknown): LoginVariant {
  const v = String(value ?? '').trim().toUpperCase();
  if (v === 'A' || v === 'B' || v === 'C') return v;
  return 'B';
}

// Lê do Vite: aceita VITE_LOGIN_VARIANT ou VITE_LOGIN_VARIANTE
const env = (import.meta as any)?.env ?? {};
const ACTIVE_VARIANT: LoginVariant = resolveVariant(
  env.VITE_LOGIN_VARIANT ?? env.VITE_LOGIN_VARIANTE ?? 'B'
);

const base = {
  page: 'min-h-screen relative overflow-hidden flex items-center justify-center p-4',
  cardWrap: 'w-full max-w-md',
  card: 'rounded-2xl p-8 space-y-6 relative',
  title: 'text-3xl font-extrabold uppercase tracking-tight',
  subtitle: 'text-sm mt-2',
  label: 'block text-xs font-bold uppercase mb-1',
  input:
    'w-full p-3 rounded-xl outline-none font-medium transition disabled:opacity-60',
  inputFocusBase: 'focus:ring-2',
  buttonBase:
    'w-full py-4 rounded-xl font-black uppercase tracking-wider text-white transition-all active:scale-[0.99] disabled:opacity-60 focus:outline-none focus:ring-2',
  linkBase: 'font-bold transition-colors',
  footer: 'text-center text-xs font-bold uppercase mt-6',
  alertBox: 'rounded-xl text-sm font-semibold border',
};

const theme: Record<
  LoginVariant,
  typeof base & {
    pageBg: string;
    glowA: string;
    glowB: string;

    cardBg: string;
    cardBorder: string;
    cardShadow: string;
    cardFinish: string;

    titleColor: string;
    subtitleColor: string;

    labelColor: string;

    inputBg: string;
    inputText: string;
    inputPlaceholder: string;
    inputBorder: string;
    inputFinish: string;
    inputFocus: string;

    buttonBg: string;
    buttonShadow: string;
    buttonDisabled: string;
    buttonFinish: string;

    linkColor: string;
    footerColor: string;

    errorColors: string;
  }
> = {
  A: {
    ...base,
    pageBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800',
    glowA:
      'pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl',
    glowB:
      'pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl',

    cardBg: 'bg-white/10 backdrop-blur-xl',
    cardBorder: 'border border-white/15',
    cardShadow: 'shadow-[0_20px_60px_-25px_rgba(0,0,0,0.7)]',
    cardFinish: 'ring-1 ring-white/10 ring-inset',

    titleColor: 'text-white',
    subtitleColor: 'text-white/70',

    labelColor: 'text-white/70',

    inputBg: 'bg-white/10',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-white/40',
    inputBorder: 'border border-white/15',
    inputFinish: 'shadow-inner shadow-black/20',
    inputFocus: 'focus:ring-blue-400/70 focus:border-blue-300/40',

    buttonBg:
      'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400',
    buttonShadow: 'shadow-[0_18px_40px_-22px_rgba(0,0,0,0.8)]',
    buttonDisabled: 'bg-white/20 cursor-not-allowed',
    buttonFinish:
      'hover:brightness-110 active:brightness-95 focus:ring-white/10',

    linkColor: 'text-blue-300 hover:text-blue-100',
    footerColor: 'text-white/40',

    errorColors: 'border-red-400/30 bg-red-500/10 text-red-200',
  },

  B: {
    ...base,
    pageBg: 'bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900',
    glowA:
      'pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full bg-indigo-500/15 blur-3xl',
    glowB:
      'pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl',

    cardBg: 'bg-slate-900/55 backdrop-blur-xl',
    cardBorder: 'border border-white/10',
    cardShadow: 'shadow-2xl',
    cardFinish:
      'ring-1 ring-white/10 ring-inset before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-60',

    titleColor: 'text-white',
    subtitleColor: 'text-white/65',

    labelColor: 'text-white/65',

    inputBg: 'bg-slate-950/40',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-white/35',
    inputBorder: 'border border-white/10',
    inputFinish: 'shadow-inner shadow-black/20 hover:border-white/15',
    inputFocus: 'focus:ring-cyan-300/45 focus:border-cyan-200/35',

    buttonBg:
      'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
    buttonShadow: 'shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)]',
    buttonDisabled: 'bg-white/15 cursor-not-allowed',
    buttonFinish:
      'hover:brightness-110 active:brightness-95 focus:ring-cyan-200/25',

    linkColor: 'text-cyan-300 hover:text-cyan-100',
    footerColor: 'text-white/35',

    errorColors: 'border-red-400/25 bg-red-600/10 text-red-300',
  },

  C: {
    ...base,
    pageBg: 'bg-gradient-to-br from-black via-slate-950 to-slate-900',
    glowA:
      'pointer-events-none absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl',
    glowB:
      'pointer-events-none absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-cyan-400/15 blur-3xl',

    cardBg: 'bg-white/7 backdrop-blur-2xl',
    cardBorder: 'border border-white/15',
    cardShadow: 'shadow-2xl',
    cardFinish: 'ring-1 ring-white/10 ring-inset',

    titleColor: 'text-white',
    subtitleColor: 'text-white/70',

    labelColor: 'text-white/70',

    inputBg: 'bg-black/25',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-white/40',
    inputBorder: 'border border-white/15',
    inputFinish: 'shadow-inner shadow-black/25',
    inputFocus: 'focus:ring-fuchsia-400/50 focus:border-fuchsia-300/40',

    buttonBg:
      'bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400',
    buttonShadow: 'shadow-[0_18px_55px_-28px_rgba(0,0,0,0.9)]',
    buttonDisabled: 'bg-white/15 cursor-not-allowed',
    buttonFinish:
      'hover:brightness-110 active:brightness-95 focus:ring-white/10',

    linkColor: 'text-fuchsia-300 hover:text-fuchsia-100',
    footerColor: 'text-white/35',

    errorColors: 'border-red-400/25 bg-red-600/10 text-red-200',
  },
};

const LoginScreen: React.FC = () => {
  const v = theme[ACTIVE_VARIANT];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState(''); // mensagem neutra/sucesso (reset)
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      await authService.login(email, password);
      // Redirecionamento via AuthContext
    } catch (err: any) {
      setError('E-mail ou senha inválidos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);

const handleForgotPassword = async () => {
  setError('');
  setNotice('');

  const cleanEmail = String(email).replace(/\s+/g, '').trim();

  if (!cleanEmail) {
    setError('Informe seu e-mail para recuperar a senha.');
    return;
  }

  if (!isValidEmail(cleanEmail)) {
    setError('Digite um e-mail válido (ex.: nome@dominio.com).');
    return;
  }

  setResetLoading(true);
  try {
    await authService.resetPassword(cleanEmail);

    setNotice(
      'E-mail de recuperação enviado. Verifique sua caixa de entrada e spam.'
    );
  } catch (err: any) {
    const code = err?.code as string | undefined;

    if (code === 'auth/invalid-email') {
      setError('E-mail inválido. Confira e tente novamente.');
    } else if (code === 'auth/user-not-found') {
      // Como é sistema interno, isso evita confusão (melhor que a mensagem genérica)
      setError('Não existe usuário cadastrado com este e-mail.');
    } else if (code === 'auth/too-many-requests') {
      setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    } else {
      setError('Não foi possível enviar o e-mail de recuperação. Tente novamente.');
    }

    console.error(err);
  } finally {
    setResetLoading(false);
  }
};

  return (
    <div className={`${v.page} ${v.pageBg}`}>
      {/* glows */}
      <div className={v.glowA} />
      <div className={v.glowB} />

      {/* card */}
      <div
        className={`${v.cardWrap} ${v.card} ${v.cardBg} ${v.cardBorder} ${v.cardShadow} ${v.cardFinish}`}
      >
        {/* highlight premium no topo do card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-white/10 to-transparent"
        />

        <div className="text-center">
          <h1 className={`${v.title} ${v.titleColor}`}>Programação de Viagem</h1>
          <p className={`${v.subtitle} ${v.subtitleColor}`}>Acesso Restrito</p>
        </div>

        {/* erro (vermelho e objetivo, 1 linha) */}
        {error && (
          <div
            className={`${v.alertBox} ${v.errorColors} px-4 py-3 flex items-center gap-3`}
            role="alert"
            aria-live="polite"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 border border-red-300/20">
              <svg
                className="h-4 w-4 opacity-90"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 14.5a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            </span>

            <div className="min-w-0 leading-tight">{error}</div>
          </div>
        )}

        {/* aviso/sucesso (reset) */}
        {notice && (
          <div
            className={`${v.alertBox} border-emerald-400/25 bg-emerald-600/10 text-emerald-200 px-4 py-3 flex items-center gap-3`}
            role="status"
            aria-live="polite"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-300/20">
              <svg
                className="h-4 w-4 opacity-90"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>

            <div className="min-w-0 leading-tight">{notice}</div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className={`${v.label} ${v.labelColor}`}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${v.input} ${v.inputBg} ${v.inputText} ${v.inputPlaceholder} ${v.inputBorder} ${v.inputFinish} ${v.inputFocusBase} ${v.inputFocus}`}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className={`${v.label} ${v.labelColor}`}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${v.input} ${v.inputBg} ${v.inputText} ${v.inputPlaceholder} ${v.inputBorder} ${v.inputFinish} ${v.inputFocusBase} ${v.inputFocus}`}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {/* Esqueci minha senha */}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading || loading}
                className={`${v.linkBase} ${v.linkColor} text-xs`}
              >
                {resetLoading ? 'Enviando...' : 'Esqueci minha senha'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || resetLoading}
            className={`${v.buttonBase} ${v.buttonShadow} ${v.buttonFinish} ${
              loading ? v.buttonDisabled : v.buttonBg
            }`}
          >
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className={`${v.footer} ${v.footerColor}`}>
          &copy; {new Date().getFullYear()} Programação de Viagem
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
