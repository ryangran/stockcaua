import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { fetchUsuariosPendentes, aprovarUsuario, rejeitarUsuario } from '../../lib/api';
import { Check, X, Clock, ShieldCheck, Shield } from 'lucide-react';
import type { Usuario } from '../../types';

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  color: 'var(--vs-orange)', icon: Clock },
  aprovado:  { label: 'Aprovado',  color: '#22C55E',          icon: ShieldCheck },
  rejeitado: { label: 'Rejeitado', color: 'var(--vs-red)',    icon: X },
};

export function AdminUsuarios({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  useEffect(() => {
    if (open) carregar();
  }, [open]);

  const [semTabela, setSemTabela] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const SQL_SETUP = `CREATE TABLE IF NOT EXISTS usuarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  senha text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz DEFAULT now()
);

INSERT INTO usuarios (nome, senha, role, status)
VALUES ('caua', '160206', 'admin', 'aprovado')
ON CONFLICT (nome) DO NOTHING;

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS editado_por text;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS criado_por text;`;

  async function carregar() {
    setLoading(true);
    setSemTabela(false);
    try {
      setUsuarios(await fetchUsuariosPendentes());
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? '';
      if (msg.includes('schema cache') || msg.includes('not find')) {
        setSemTabela(true);
      } else {
        toast.error(msg || 'Erro ao carregar usuários');
      }
    } finally {
      setLoading(false);
    }
  }

  function copiarSQL() {
    navigator.clipboard.writeText(SQL_SETUP);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function aprovar(id: string) {
    setAtualizando(id);
    try {
      await aprovarUsuario(id);
      setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, status: 'aprovado' } : u));
      toast.success('Usuário aprovado');
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Erro');
    } finally {
      setAtualizando(null);
    }
  }

  async function rejeitar(id: string) {
    setAtualizando(id);
    try {
      await rejeitarUsuario(id);
      setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, status: 'rejeitado' } : u));
      toast.success('Usuário rejeitado');
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Erro');
    } finally {
      setAtualizando(null);
    }
  }

  const pendentes = usuarios.filter((u) => u.status === 'pendente');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg"
        style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm" style={{ color: 'var(--vs-orange)' }}>
            <Shield size={15} /> Gerenciar Usuários
            {pendentes.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--vs-orange)', color: '#000' }}>
                {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-xs" style={{ color: 'var(--vs-muted)' }}>Carregando...</p>
        ) : semTabela ? (
          <div className="space-y-3">
            <div className="rounded-lg px-4 py-3 text-xs" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--vs-orange)' }}>Configuração necessária</p>
              <p style={{ color: 'var(--vs-muted)' }}>
                A tabela de usuários ainda não existe. Copie o SQL abaixo e execute no{' '}
                <a href="https://supabase.com/dashboard/project/ucetccekkxacurkfchwd/sql/new" target="_blank" rel="noreferrer" style={{ color: 'var(--vs-orange)', textDecoration: 'underline' }}>
                  Supabase SQL Editor ↗
                </a>
              </p>
            </div>
            <pre
              className="rounded-lg p-3 text-xs overflow-auto max-h-48 select-all"
              style={{ background: '#0a0a0a', border: '1px solid var(--vs-border)', color: '#ccc', fontFamily: 'monospace', lineHeight: 1.6 }}
            >
              {SQL_SETUP}
            </pre>
            <button
              onClick={copiarSQL}
              className="w-full rounded-lg py-2 text-xs font-bold transition-colors"
              style={{ background: copiado ? 'rgba(34,197,94,0.2)' : 'var(--vs-orange)', color: copiado ? '#22C55E' : '#000' }}
            >
              {copiado ? '✓ Copiado!' : 'Copiar SQL'}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--vs-muted)' }}>
              Após executar, feche e reabra este painel.
            </p>
          </div>
        ) : usuarios.length === 0 ? (
          <p className="py-8 text-center text-xs" style={{ color: 'var(--vs-muted)' }}>Nenhum usuário cadastrado</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {usuarios.map((u) => {
              const cfg = STATUS_CONFIG[u.status];
              const Icon = cfg.icon;
              const emEspera = atualizando === u.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vs-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.nome}</p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: cfg.color }}>
                      <Icon size={11} /> {cfg.label}
                      {u.role === 'admin' && <span className="ml-1 text-xs" style={{ color: 'var(--vs-muted)' }}>(admin)</span>}
                    </p>
                  </div>

                  {u.status === 'pendente' && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => aprovar(u.id)}
                        disabled={emEspera}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        <Check size={12} /> Aprovar
                      </button>
                      <button
                        onClick={() => rejeitar(u.id)}
                        disabled={emEspera}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                        style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--vs-red)', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        <X size={12} /> Rejeitar
                      </button>
                    </div>
                  )}

                  {u.status === 'aprovado' && (
                    <button
                      onClick={() => rejeitar(u.id)}
                      disabled={emEspera}
                      className="rounded px-2 py-1 text-xs transition-colors hover:bg-red-500/10"
                      style={{ color: 'var(--vs-muted)' }}
                      title="Revogar acesso"
                    >
                      Revogar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
