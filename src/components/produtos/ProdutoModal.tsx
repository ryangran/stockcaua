import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { createProduto, updateProduto } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Produto } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  produto?: Produto;
}

const empty = {
  codigo: '', nome: '', unidade: 'un',
  categoria: '', especificacao: '',
  estoque_atual: 0, estoque_minimo: 0, estoque_maximo: 0, preco_medio: 0,
};

export function ProdutoModal({ open, onClose, produto }: Props) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const { upsertProduto } = useStockStore();
  const usuarioLogado = useAuthStore((s) => s.usuarioLogado);

  useEffect(() => {
    if (open) {
      setForm(produto ? {
        codigo: produto.codigo,
        nome: produto.nome,
        unidade: produto.unidade,
        categoria: produto.categoria ?? '',
        especificacao: produto.especificacao ?? '',
        estoque_atual: produto.estoque_atual,
        estoque_minimo: produto.estoque_minimo,
        estoque_maximo: produto.estoque_maximo,
        preco_medio: produto.preco_medio,
      } : empty);
    }
  }, [open, produto]);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.codigo || !form.nome) { toast.error('Código e nome são obrigatórios'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        categoria: form.categoria || null,
        especificacao: form.especificacao || null,
      };
      if (produto) {
        const p = await updateProduto(produto.id, { ...payload, editado_por: usuarioLogado });
        upsertProduto(p);
        toast.success('Produto atualizado');
      } else {
        const p = await createProduto({ ...payload, criado_por: usuarioLogado });
        upsertProduto(p);
        toast.success('Produto criado');
      }
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, key: string, type = 'text') => (
    <div>
      <Label className="text-xs mb-1 block" style={{ color: 'var(--vs-muted)' }}>{label}</Label>
      <Input
        type={type}
        value={(form as Record<string, string | number>)[key]}
        onChange={(e) => set(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)', color: '#fff' }}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', maxWidth: 520 }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--vs-orange)' }}>
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {field('Código *', 'codigo')}
          {field('Unidade', 'unidade')}
          <div className="col-span-2">{field('Nome *', 'nome')}</div>
          {field('Categoria', 'categoria')}
          <div className="col-span-2">
            <Label className="text-xs mb-1 block" style={{ color: 'var(--vs-muted)' }}>Especificação</Label>
            <textarea
              value={form.especificacao}
              onChange={(e) => set('especificacao', e.target.value)}
              rows={2}
              placeholder="Detalhes, marca, modelo..."
              className="w-full rounded-md px-3 py-2 text-sm resize-none outline-none"
              style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)', color: '#fff' }}
            />
          </div>
          {field('Estoque Atual', 'estoque_atual', 'number')}
          {field('Preço Médio (R$)', 'preco_medio', 'number')}
          {field('Estoque Mínimo', 'estoque_minimo', 'number')}
          {field('Estoque Máximo', 'estoque_maximo', 'number')}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={salvar} disabled={loading} style={{ background: 'var(--vs-orange)', color: '#000' }}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
