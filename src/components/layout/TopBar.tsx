import { useState } from 'react';
import { Zap, LogOut, KeyRound, User } from 'lucide-react';
import { useStockStore } from '../../store/useStockStore';
import { useAuthStore } from '../../store/useAuthStore';
import { TerminalCounter } from '../shared/TerminalCounter';
import { AlterarCredenciaisModal } from '../shared/AlterarCredenciaisModal';

const TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/produtos':      'Produtos',
  '/compras':       'Compras',
  '/kits':          'Kits de Produção',
  '/movimentacoes': 'Movimentações',
  '/retornos':      'Retorno de Evento',
  '/necessidades':  'Necessidades',
};

export function TopBar({ pathname }: { pathname: string }) {
  const tema = useStockStore((s) => s.tema);
  const toggleTema = useStockStore((s) => s.toggleTema);
  const { usuarioLogado, logout } = useAuthStore();

  const [menuAberto, setMenuAberto] = useState(false);
  const [modalCredenciais, setModalCredenciais] = useState(false);

  const title = TITLES[pathname] ?? 'Visual Stands Design';

  return (
    <>
      <header
        className="flex h-14 shrink-0 items-center justify-between px-6"
        style={{ background: 'var(--vs-surface)', borderBottom: '1px solid var(--vs-border)' }}
      >
        <h1
          className="text-base font-semibold tracking-wide neon-text"
          style={{ color: 'var(--vs-orange)' }}
        >
          {title}
        </h1>

        <div className="flex items-center gap-3">
          <TerminalCounter />

          {/* Tema toggle */}
          <button
            onClick={toggleTema}
            title={tema === 'dark' ? 'Ativar Neon' : 'Desativar Neon'}
            className="rounded-md p-1.5 transition-colors hover:bg-white/5"
            style={{ color: tema === 'neon' ? 'var(--vs-orange)' : 'var(--vs-muted)' }}
          >
            <Zap size={15} fill={tema === 'neon' ? 'var(--vs-orange)' : 'none'} />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuAberto((v) => !v)}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-mono transition-colors hover:bg-white/5"
              style={{ color: 'var(--vs-muted)', border: '1px solid var(--vs-border)' }}
            >
              <User size={13} style={{ color: 'var(--vs-orange)' }} />
              {usuarioLogado}
            </button>

            {menuAberto && (
              <>
                {/* Overlay to close */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />

                <div
                  className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden"
                  style={{
                    background: 'var(--vs-surface-2)',
                    border: '1px solid var(--vs-border)',
                    minWidth: 180,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  <button
                    onClick={() => { setMenuAberto(false); setModalCredenciais(true); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                    style={{ color: '#fff' }}
                  >
                    <KeyRound size={13} style={{ color: 'var(--vs-orange)' }} />
                    Alterar credenciais
                  </button>

                  <div className="h-px mx-3" style={{ background: 'var(--vs-border)' }} />

                  <button
                    onClick={() => { setMenuAberto(false); logout(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                    style={{ color: 'var(--vs-red)' }}
                  >
                    <LogOut size={13} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <AlterarCredenciaisModal
        open={modalCredenciais}
        onClose={() => setModalCredenciais(false)}
      />
    </>
  );
}
