import { useRef, useEffect, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { StatusBadge } from '../shared/StatusBadge';
import { ProdutoModal } from './ProdutoModal';
import { deleteProduto } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { Produto } from '../../types';
import { ImportarPlanilha } from '../shared/ImportarPlanilha';

export function ProdutosTable() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | undefined>();
  const { getProdutosFiltrados, filtro, setFiltro, removeProduto } = useStockStore();
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const produtos = getProdutosFiltrados();

  useEffect(() => {
    if (tbodyRef.current?.children.length) {
      gsap.from(tbodyRef.current.children, {
        opacity: 0, x: -8, stagger: 0.03, duration: 0.25, ease: 'power2.out',
      });
    }
  }, [produtos.length]);

  async function excluir(p: Produto) {
    if (!confirm(`Excluir "${p.nome}"?`)) return;
    try {
      await deleteProduto(p.id);
      removeProduto(p.id);
      toast.success('Produto excluído');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir');
    }
  }

  const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vs-muted)' }} />
          <Input
            placeholder="Buscar por nome ou código..."
            value={filtro.busca}
            onChange={(e) => setFiltro({ busca: e.target.value })}
            className="pl-9"
            style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', color: '#fff' }}
          />
        </div>

        {/* Status filter */}
        {(['todos', 'ok', 'baixo', 'critico'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro({ status: s })}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: filtro.status === s ? 'var(--vs-orange)' : 'var(--vs-surface)',
              color: filtro.status === s ? '#000' : 'var(--vs-muted)',
              border: '1px solid var(--vs-border)',
            }}
          >
            {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <ImportarPlanilha />
          <Button
            onClick={() => { setEditando(undefined); setModalOpen(true); }}
            style={{ background: 'var(--vs-orange)', color: '#000' }}
          >
            <Plus size={14} className="mr-1.5" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="vs-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--vs-border)' }}>
                {['Código', 'Nome', 'Estoque', 'Mín', 'Máx', 'Preço Médio', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                produtos.map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid var(--vs-border)' }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--vs-muted)' }}>{p.codigo}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.nome}</td>
                    <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>
                      {p.estoque_atual} <span className="text-xs font-normal" style={{ color: 'var(--vs-muted)' }}>{p.unidade}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--vs-muted)' }}>{p.estoque_minimo}</td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--vs-muted)' }}>{p.estoque_maximo}</td>
                    <td className="px-4 py-3 tabular-nums text-xs">{fmtR$(p.preco_medio)}</td>
                    <td className="px-4 py-3"><StatusBadge produto={p} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setEditando(p); setModalOpen(true); }}
                          className="rounded p-1.5 transition-colors hover:bg-white/5"
                          style={{ color: 'var(--vs-muted)' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => excluir(p)}
                          className="rounded p-1.5 transition-colors hover:bg-red-500/10"
                          style={{ color: 'var(--vs-red)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 text-xs" style={{ color: 'var(--vs-muted)', borderTop: '1px solid var(--vs-border)' }}>
          {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
        </div>
      </div>

      <ProdutoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        produto={editando}
      />
    </div>
  );
}
