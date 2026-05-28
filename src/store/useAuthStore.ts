import { create } from 'zustand';
import { loginCheck } from '../lib/api';

const isBrowser = typeof window !== 'undefined';

interface Session { usuario: string; role: 'admin' | 'user' }

function setSessionCookie(session: Session) {
  if (!isBrowser) return;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  document.cookie = `stockos_session=${encodeURIComponent(JSON.stringify(session))};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getSessionCookie(): Session | null {
  if (!isBrowser) return null;
  const match = document.cookie.match(/(?:^|;\s*)stockos_session=([^;]+)/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    if (parsed?.usuario && (parsed.role === 'admin' || parsed.role === 'user')) {
      return { usuario: parsed.usuario, role: parsed.role };
    }
    return null; // cookie inválido → força novo login
  } catch {
    return null; // cookie malformado → força novo login
  }
}

function clearSessionCookie() {
  if (!isBrowser) return;
  document.cookie = 'stockos_session=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict';
}

interface AuthState {
  isAuthenticated: boolean;
  usuarioLogado: string;
  role: 'admin' | 'user';
  login: (usuario: string, senha: string) => Promise<boolean | 'pendente'>;
  logout: () => void;
  alterarCredenciais: (senhaAtual: string, novoUsuario: string, novaSenha: string) => Promise<boolean>;
}

const session = getSessionCookie();

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: !!session,
  usuarioLogado: session?.usuario ?? '',
  role: session?.role ?? 'user',

  login: async (usuario, senha) => {
    try {
      const result = await loginCheck(usuario, senha);
      if (result.ok) {
        const sess: Session = { usuario: result.nome, role: result.role };
        setSessionCookie(sess);
        set({ isAuthenticated: true, usuarioLogado: result.nome, role: result.role });
        return true;
      }
      if (result.motivo === 'pendente') return 'pendente';
      return false;
    } catch {
      return false;
    }
  },

  logout: () => {
    clearSessionCookie();
    set({ isAuthenticated: false, usuarioLogado: '', role: 'user' });
  },

  alterarCredenciais: async (senhaAtual, novoUsuario, novaSenha) => {
    // Verifica senha atual e atualiza na lista
    try {
      const { updateCredenciais } = await import('../lib/api');
      return updateCredenciais(get().usuarioLogado, senhaAtual, novoUsuario.trim(), novaSenha, get().role);
    } catch {
      return false;
    }
  },
}));
