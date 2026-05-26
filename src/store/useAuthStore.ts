import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const isBrowser = typeof window !== 'undefined';

function setSessionCookie(usuario: string) {
  if (!isBrowser) return;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
  document.cookie = `stockos_session=${encodeURIComponent(usuario)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getSessionCookie(): string | null {
  if (!isBrowser) return null;
  const match = document.cookie.match(/(?:^|;\s*)stockos_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function clearSessionCookie() {
  if (!isBrowser) return;
  document.cookie = 'stockos_session=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict';
}

interface AuthState {
  isAuthenticated: boolean;
  usuarioLogado: string;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  alterarCredenciais: (senhaAtual: string, novoUsuario: string, novaSenha: string) => Promise<boolean>;
}

const sessionUsuario = getSessionCookie();

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: !!sessionUsuario,
  usuarioLogado: sessionUsuario ?? '',

  login: async (usuario, senha) => {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('usuario, senha')
      .eq('id', 'auth')
      .single();

    if (error) throw new Error('Erro ao conectar com o banco. Verifique a conexão.');
    if (!data) throw new Error('Configuração de acesso não encontrada. Execute o SQL de setup.');
    if (usuario.trim() !== data.usuario || senha !== data.senha) return false;

    setSessionCookie(usuario.trim());
    set({ isAuthenticated: true, usuarioLogado: usuario.trim() });
    return true;
  },

  logout: () => {
    clearSessionCookie();
    set({ isAuthenticated: false, usuarioLogado: '' });
  },

  alterarCredenciais: async (senhaAtual, novoUsuario, novaSenha) => {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('senha')
      .eq('id', 'auth')
      .single();

    if (error || !data || senhaAtual !== data.senha) return false;

    const { error: updateErr } = await supabase
      .from('configuracoes')
      .update({ usuario: novoUsuario.trim(), senha: novaSenha, updated_at: new Date().toISOString() })
      .eq('id', 'auth');

    if (updateErr) return false;

    setSessionCookie(novoUsuario.trim());
    set({ usuarioLogado: novoUsuario.trim() });
    return true;
  },
}));
