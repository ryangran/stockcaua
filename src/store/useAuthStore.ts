import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
    if (parsed?.usuario) return { usuario: parsed.usuario, role: parsed.role ?? 'admin' };
    // backward compat: old cookie was plain string
    return { usuario: decodeURIComponent(match[1]), role: 'admin' };
  } catch {
    return { usuario: decodeURIComponent(match[1]), role: 'admin' };
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
  role: session?.role ?? 'admin',

  login: async (usuario, senha) => {
    // Tenta a tabela usuarios primeiro
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, role, status')
      .eq('nome', usuario.trim())
      .eq('senha', senha)
      .single();

    if (!error && data) {
      if (data.status === 'pendente') return 'pendente';
      if (data.status === 'rejeitado') return false;
      const sess: Session = { usuario: data.nome, role: data.role as 'admin' | 'user' };
      setSessionCookie(sess);
      set({ isAuthenticated: true, usuarioLogado: data.nome, role: data.role as 'admin' | 'user' });
      return true;
    }

    // Fallback: admin hardcoded se tabela não existir
    if (usuario.trim() === 'caua' && senha === '160206') {
      const sess: Session = { usuario: 'caua', role: 'admin' };
      setSessionCookie(sess);
      set({ isAuthenticated: true, usuarioLogado: 'caua', role: 'admin' });
      return true;
    }

    return false;
  },

  logout: () => {
    clearSessionCookie();
    set({ isAuthenticated: false, usuarioLogado: '', role: 'user' });
  },

  alterarCredenciais: async (senhaAtual, novoUsuario, novaSenha) => {
    const { usuarioLogado, role } = get();
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nome', usuarioLogado)
      .eq('senha', senhaAtual)
      .single();

    if (error || !data) return false;

    const { error: updateErr } = await supabase
      .from('usuarios')
      .update({ nome: novoUsuario.trim(), senha: novaSenha })
      .eq('id', data.id);

    if (updateErr) return false;

    const sess: Session = { usuario: novoUsuario.trim(), role };
    setSessionCookie(sess);
    set({ usuarioLogado: novoUsuario.trim() });
    return true;
  },
}));
