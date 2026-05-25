import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { registrarCompra } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';

export function CompraForm({ onSuccess }: { onSuccess: () => void }) {
  const { produtos, upsertProduto, terminalId } = useStockStore();
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [loading, setLoading] = useState(false);

  const produtoSelecionado = produtos.find((p) => p.id === produtoId);
  const qtd = parseFloat(quantidade) || 0;
  const preco = parseFloat(precoUnitario.replace(',', '.')) || 0;
  const total = qtd * preco;

  // Preview do preço médio
  const novoPrecoMedio =
    produtoSelecionado && qtd > 0 && preco > 0
      ? ((produtoSelecionado.estoque_atual * produtoSelecionado.preco_medio +
          qtd * preco) /
          (produtoSelecionado.estoque_atual + qtd))
      : null;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoId || qtd <= 0 || preco <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setLoading(true);
    try {
      const { produto } = await registrarCompra({
        produto_id: produtoId,
        quantidade: qtd,
        preco_unitario: preco,
        fornecedor: fornecedor || undefined,
        terminal: terminalId,
      });
      upsertProduto(produto);
      toast.success(`Compra registrada — novo estoque: ${produto.estoque_atual} ${produto.unidade}`);
      setProdutoId('');
      setQuantidade('');
      setPrecoUnitario('');
      setFornecedor('');
      onSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar compra');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', color: '#fff' };
  const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <form onSubmit={salvar} className="vs-card p-6 space-y-5">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>Nova Compra</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Produto */}
        <div className="col-span-2">
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Produto *</Label>
          <Select value={produtoId} onValueChange={setProdutoId}>
            <SelectTrigger style={{ ...inputStyle, minHeight: 40 }}>
              <SelectValue placeholder="Selecione um produto..." />
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)' }}>
              {produtos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.codigo} — {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Quantidade *</Label>
          <Input type="number" min="0" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Preço Unitário (R$) *</Label>
          <Input type="number" min="0" step="0.01" value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} style={inputStyle} />
        </div>

        <div className="col-span-2">
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Fornecedor</Label>
          <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} style={inputStyle} placeholder="Opcional" />
        </div>
      </div>

      {/* Preview */}
      {produtoSelecionado && qtd > 0 && preco > 0 && (
        <div className="rounded-lg p-4 space-y-2 text-sm" style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--vs-muted)' }}>Total da compra</span>
            <span className="font-bold" style={{ color: 'var(--vs-orange)' }}>{fmtR$(total)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--vs-muted)' }}>Estoque atual</span>
            <span>{produtoSelecionado.estoque_atual} {produtoSelecionado.unidade}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--vs-muted)' }}>Novo estoque</span>
            <span className="font-bold text-green-400">{produtoSelecionado.estoque_atual + qtd} {produtoSelecionado.unidade}</span>
          </div>
          {novoPrecoMedio !== null && (
            <div className="flex justify-between pt-1" style={{ borderTop: '1px solid var(--vs-border)' }}>
              <span style={{ color: 'var(--vs-muted)' }}>Novo preço médio</span>
              <span className="font-bold">{fmtR$(novoPrecoMedio)}</span>
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full" style={{ background: 'var(--vs-orange)', color: '#000' }}>
        {loading ? 'Registrando...' : 'Registrar Compra'}
      </Button>
    </form>
  );
}
