import { create } from 'zustand';

const SESSION_KEY = 'stockos_session';
const CREDS_KEY = 'stockos_creds';
const DEFAULT_CREDS = { usuario: 'caua', senha: '160206' };

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function safeGet(key: string): string | null {
  if (!isBrowser) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeSet(key: string, value: string): void {
  if (!isBrowser) return;
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function safeRemove(key: string): void {
  if (!isBrowser) return;
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

function getCreds(): { usuario: string; senha: string } {
  const raw = safeGet(CREDS_KEY);
  if (!raw) return DEFAULT_CREDS;
  try { return JSON.parse(raw); } catch { return DEFAULT_CREDS; }
}

interface AuthState {
  isAuthenticated: boolean;
  usuarioLogado: string;
  login: (usuario: string, senha: string) => boolean;
  logout: () => void;
  alterarCredenciais: (senhaAtual: string, novoUsuario: string, novaSenha: string) => boolean;
}

export const useAuthStore = create<AuthState>()((set) => {
  const session = safeGet(SESSION_KEY);
  const sessionData = session ? (() => { try { return JSON.parse(session); } catch { return null; } })() : null;

  return {
    isAuthenticated: !!sessionData,
    usuarioLogado: sessionData?.usuario ?? '',

    login: (usuario, senha) => {
      const creds = getCreds();
      if (usuario.trim() === creds.usuario && senha === creds.senha) {
        safeSet(SESSION_KEY, JSON.stringify({ usuario }));
        set({ isAuthenticated: true, usuarioLogado: usuario });
        return true;
      }
      return false;
    },

    logout: () => {
      safeRemove(SESSION_KEY);
      set({ isAuthenticated: false, usuarioLogado: '' });
    },

    alterarCredenciais: (senhaAtual, novoUsuario, novaSenha) => {
      const creds = getCreds();
      if (senhaAtual !== creds.senha) return false;
      safeSet(CREDS_KEY, JSON.stringify({ usuario: novoUsuario.trim(), senha: novaSenha }));
      // Atualiza sessão com novo usuário
      safeSet(SESSION_KEY, JSON.stringify({ usuario: novoUsuario.trim() }));
      set({ usuarioLogado: novoUsuario.trim() });
      return true;
    },
  };
});
