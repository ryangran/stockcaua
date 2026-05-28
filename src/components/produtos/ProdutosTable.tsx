import { useRef, useEffect, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { StatusBadge } from '../shared/StatusBadge';
import { ProdutoModal } from './ProdutoModal';
import { deleteProduto } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Produto } from '../../types';
import { ImportarPlanilha } from '../shared/ImportarPlanilha';
import { PasteModal } from '../shared/PasteModal';
import { useAuthStore } from '../../store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="cursor-pointer"
      style={{ accentColor: 'var(--vs-orange)', width: 14, height: 14 }}
    />
  );
}

function ConfirmDialog({ open, titulo, descricao, onConfirm, onCancel, carregando }: {
  open: boolean;
  titulo: string;
  descricao: string;
  onConfirm: () => void;
  onCancel: () => void;
  carregando?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm" style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm" style={{ color: 'var(--vs-red)' }}>
            <AlertTriangle size={15} /> {titulo}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: 'var(--vs-muted)' }}>{descricao}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={carregando}>Cancelar</Button>
          <Button
            onClick={onConfirm}
            disabled={carregando}
            style={{ background: 'var(--vs-red)', color: '#fff' }}
          >
            {carregando ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProdutosTable() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | undefined>();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [confirmando, setConfirmando] = useState<'single' | 'bulk' | null>(null);
  const [alvoExclusao, setAlvoExclusao] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const { getProdutosFiltrados, filtro, setFiltro, removeProduto } = useStockStore();
  const usuarioLogado = useAuthStore((s) => s.usuarioLogado);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const produtos = getProdutosFiltrados();

  const todosSelecionados = produtos.length > 0 && selecionados.size === produtos.length;
  const algunsSelecionados = selecionados.size > 0 && selecionados.size < produtos.length;

  useEffect(() => {
    if (tbodyRef.current?.children.length) {
      gsap.from(tbodyRef.current.children, {
        opacity: 0, x: -8, stagger: 0.02, duration: 0.2, ease: 'power2.out',
      });
    }
  }, [produtos.length]);

  useEffect(() => { setSelecionados(new Set()); }, [filtro]);

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setSelecionados(todosSelecionados ? new Set() : new Set(produtos.map((p) => p.id)));
  }

  async function confirmarExclusaoSingle() {
    if (!alvoExclusao) return;
    setExcluindo(true);
    try {
      await deleteProduto(alvoExclusao.id);
      removeProduto(alvoExclusao.id);
      setSelecionados((prev) => { const n = new Set(prev); n.delete(alvoExclusao.id); return n; });
      toast.success(`"${alvoExclusao.nome}" excluído por ${usuarioLogado}`);
    } catch (e: unknown) {
      console.error('Erro ao excluir produto:', e);
      const msg = (e as { message?: string })?.message ?? String(e);
      toast.error(`Erro: ${msg}`);
    } finally {
      setExcluindo(false);
      setConfirmando(null);
      setAlvoExclusao(null);
    }
  }

  async function confirmarExclusaoBulk() {
    setExcluindo(true);
    const ids = Array.from(selecionados);
    let ok = 0;
    let erros = 0;
    for (const id of ids) {
      try {
        await deleteProduto(id);
        removeProduto(id);
        ok++;
      } catch (e) {
        console.error('Erro ao excluir:', id, e);
        erros++;
      }
    }
    setSelecionados(new Set());
    setExcluindo(false);
    setConfirmando(null);
    if (erros === 0) toast.success(`${ok} produto(s) excluído(s) por ${usuarioLogado}`);
    else toast.warning(`${ok} excluído(s), ${erros} com erro — veja o console`);
  }

  const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
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
          {selecionados.size > 0 && (
            <button
              onClick={() => setConfirmando('bulk')}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--vs-red)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <Trash2 size={13} />
              Excluir {selecionados.size} selecionado(s)
            </button>
          )}
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
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={todosSelecionados}
                    indeterminate={algunsSelecionados}
                    onChange={toggleTodos}
                  />
                </th>
                {['Setor', 'Produto', 'Especificação', 'Qtd', 'Unidade', 'Vlr Unitário', 'Valor Total', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                produtos.map((p) => {
                  const sel = selecionados.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{
                        borderBottom: '1px solid var(--vs-border)',
                        background: sel ? 'rgba(249,115,22,0.04)' : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <Checkbox checked={sel} onChange={() => toggleSelecionado(p.id)} />
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>
                        {p.categoria || <span style={{ color: 'var(--vs-border)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-medium truncate">{p.nome}</div>
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--vs-muted)' }}>{p.codigo}</div>
                        {p.editado_por && (
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--vs-muted)' }}>
                            editado por <span style={{ color: 'var(--vs-orange)' }}>{p.editado_por}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] text-xs" style={{ color: 'var(--vs-muted)' }}>
                        {p.especificacao
                          ? <span className="truncate block" title={p.especificacao}>{p.especificacao}</span>
                          : <span style={{ color: 'var(--vs-border)' }}>—</span>
                        }
                      </td>
                      <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>
                        {p.estoque_atual}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{p.unidade}</td>
                      <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--vs-muted)' }}>{fmtR$(p.preco_medio)}</td>
                      <td className="px-4 py-3 tabular-nums text-xs">{fmtR$(p.estoque_atual * p.preco_medio)}</td>
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
                            onClick={() => { setAlvoExclusao(p); setConfirmando('single'); }}
                            className="rounded p-1.5 transition-colors hover:bg-red-500/10"
                            style={{ color: 'var(--vs-red)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 text-xs" style={{ color: 'var(--vs-muted)', borderTop: '1px solid var(--vs-border)' }}>
          {selecionados.size > 0
            ? <span style={{ color: 'var(--vs-orange)' }}>{selecionados.size} selecionado(s) de {produtos.length}</span>
            : <span>{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</span>
          }
        </div>
      </div>

      {/* Confirmar exclusão simples */}
      <ConfirmDialog
        open={confirmando === 'single'}
        titulo="Excluir produto"
        descricao={`Excluir "${alvoExclusao?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmarExclusaoSingle}
        onCancel={() => { setConfirmando(null); setAlvoExclusao(null); }}
        carregando={excluindo}
      />

      {/* Confirmar exclusão em lote */}
      <ConfirmDialog
        open={confirmando === 'bulk'}
        titulo="Excluir produtos selecionados"
        descricao={`Excluir ${selecionados.size} produto(s)? Esta ação não pode ser desfeita.`}
        onConfirm={confirmarExclusaoBulk}
        onCancel={() => setConfirmando(null)}
        carregando={excluindo}
      />

      <ProdutoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        produto={editando}
      />

      <PasteModal tipo="entrada" />
    </div>
  );
}
