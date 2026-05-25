import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { registrarMovimentacao } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';
import { PasteModal } from '../shared/PasteModal';
import { Plus, ClipboardPaste } from 'lucide-react';
import type { MovimentacaoTipo } from '../../types';

const TIPO_COLORS: Record<MovimentacaoTipo, string> = {
  entrada: '#22C55E',
  saida:   'var(--vs-red)',
  retorno: 'var(--vs-orange)',
  ajuste:  'var(--vs-muted)',
};

const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function MovimentacoesTable() {
  const { movimentacoes, produtos, upsertProduto, addMovimentacao, terminalId, setPasteModalAberto } = useStockStore();
  const [modalOpen, setModalOpen] = useState(false);
  type FormTipo = 'saida' | 'ajuste';
  const [form, setForm] = useState<{ produto_id: string; tipo: FormTipo; quantidade: string; motivo: string }>({ produto_id: '', tipo: 'saida', quantidade: '', motivo: '' });
  const [loading, setLoading] = useState(false);

  const inputStyle = { background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)', color: '#fff' };

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    const qtd = parseFloat(form.quantidade);
    if (!form.produto_id || qtd <= 0) { toast.error('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      await registrarMovimentacao({
        produto_id: form.produto_id,
        tipo: form.tipo,
        quantidade: qtd,
        motivo: form.motivo || undefined,
        terminal: terminalId,
      });
      const prod = produtos.find((p) => p.id === form.produto_id)!;
      const delta = form.tipo === 'saida' ? -qtd : qtd;
      upsertProduto({ ...prod, estoque_atual: prod.estoque_atual + delta });
      toast.success('Movimentação registrada');
      setModalOpen(false);
      setForm({ produto_id: '', tipo: 'saida', quantidade: '', motivo: '' });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setModalOpen(true)} style={{ background: 'var(--vs-orange)', color: '#000' }}>
          <Plus size={14} className="mr-1.5" /> Nova Movimentação
        </Button>
        <Button
          variant="outline"
          onClick={() => setPasteModalAberto(true)}
          style={{ borderColor: 'var(--vs-border)', color: 'var(--vs-muted)' }}
        >
          <ClipboardPaste size={14} className="mr-1.5" /> Importar Paste
        </Button>
        <span className="text-xs" style={{ color: 'var(--vs-muted)', marginLeft: 'auto' }}>
          Ctrl+V em qualquer lugar para importar planilha
        </span>
      </div>

      {/* Table */}
      <div className="vs-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--vs-border)' }}>
                {['Data', 'Produto', 'Tipo', 'Quantidade', 'Motivo', 'Terminal'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimentacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                    Nenhuma movimentação registrada
                  </td>
                </tr>
              ) : (
                movimentacoes.slice(0, 100).map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--vs-border)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{fmtDate(m.created_at)}</td>
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">{m.produto?.nome ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium uppercase" style={{ color: TIPO_COLORS[m.tipo] }}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold" style={{ color: TIPO_COLORS[m.tipo] }}>
                      {m.tipo === 'saida' ? '−' : '+'}{m.quantidade} <span className="text-xs font-normal" style={{ color: 'var(--vs-muted)' }}>{m.produto?.unidade}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{m.motivo ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--vs-muted)' }}>{m.terminal ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nova movimentação */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && setModalOpen(false)}>
        <DialogContent style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vs-orange)' }}>Nova Movimentação</DialogTitle>
          </DialogHeader>
          <form onSubmit={registrar} className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Produto *</Label>
              <Select value={form.produto_id} onValueChange={(v) => setForm((f) => ({ ...f, produto_id: v }))}>
                <SelectTrigger style={{ ...inputStyle, minHeight: 40 }}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)' }}>
                  {produtos.map((p) => <SelectItem key={p.id} value={p.id}>{p.codigo} — {p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as FormTipo }))}>
                  <SelectTrigger style={{ ...inputStyle, minHeight: 40 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)' }}>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>

                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Quantidade *</Label>
                <Input type="number" min="0" value={form.quantidade} onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Motivo</Label>
              <Input value={form.motivo} onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))} style={inputStyle} placeholder="Opcional" />
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} style={{ background: 'var(--vs-orange)', color: '#000' }}>
                {loading ? 'Registrando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PasteModal tipo="saida" />
    </div>
  );
}
