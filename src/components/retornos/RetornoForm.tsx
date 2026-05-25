import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { registrarRetorno } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';

export function RetornoForm({ onSuccess }: { onSuccess: () => void }) {
  const { produtos, upsertProduto, addRetorno, terminalId } = useStockStore();
  const [produtoId, setProdutoId] = useState('');
  const [saiu, setSaiu] = useState('');
  const [voltou, setVoltou] = useState('');
  const [descartada, setDescartada] = useState('0');
  const [motivo, setMotivo] = useState('');
  const [evento, setEvento] = useState('');
  const [loading, setLoading] = useState(false);

  const qtdSaiu = parseFloat(saiu) || 0;
  const qtdVoltou = parseFloat(voltou) || 0;
  const qtdDescartada = parseFloat(descartada) || 0;
  const perdas = qtdSaiu - qtdVoltou;

  const inputStyle = { background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', color: '#fff' };

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoId || qtdSaiu <= 0 || qtdVoltou < 0) {
      toast.error('Preencha os campos obrigatórios'); return;
    }
    if (qtdVoltou + qtdDescartada > qtdSaiu) {
      toast.error('Voltou + descartado não pode ser maior que o que saiu'); return;
    }
    setLoading(true);
    try {
      const prod = produtos.find((p) => p.id === produtoId)!;
      const retorno = await registrarRetorno({
        produto_id: produtoId,
        quantidade_saiu: qtdSaiu,
        quantidade_voltou: qtdVoltou,
        quantidade_descartada: qtdDescartada,
        motivo_descarte: motivo || undefined,
        evento: evento || undefined,
        terminal: terminalId,
      });
      addRetorno(retorno);
      upsertProduto({ ...prod, estoque_atual: prod.estoque_atual + qtdVoltou });
      toast.success(`Retorno registrado — ${qtdVoltou} ${prod.unidade} volta ao estoque`);
      setProdutoId(''); setSaiu(''); setVoltou(''); setDescartada('0'); setMotivo(''); setEvento('');
      onSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar retorno');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={salvar} className="vs-card p-6 space-y-5">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>Registrar Retorno de Evento</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Produto *</Label>
          <Select value={produtoId} onValueChange={setProdutoId}>
            <SelectTrigger style={{ ...inputStyle, minHeight: 40 }}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)' }}>
              {produtos.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.codigo} — {p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Qtd que saiu *</Label>
          <Input type="number" min="0" value={saiu} onChange={(e) => setSaiu(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Qtd que voltou *</Label>
          <Input type="number" min="0" value={voltou} onChange={(e) => setVoltou(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Qtd descartada</Label>
          <Input type="number" min="0" value={descartada} onChange={(e) => setDescartada(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Evento</Label>
          <Input value={evento} onChange={(e) => setEvento(e.target.value)} style={inputStyle} placeholder="Nome do evento" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Motivo do descarte</Label>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} style={inputStyle} rows={2} placeholder="Opcional" />
        </div>
      </div>

      {/* Preview de perdas */}
      {qtdSaiu > 0 && qtdVoltou >= 0 && (
        <div className="rounded-lg p-4 space-y-2 text-sm" style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--vs-muted)' }}>Retorno ao estoque</span>
            <span className="font-bold text-green-400">+{qtdVoltou}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--vs-muted)' }}>Perdas totais</span>
            <span className="font-bold" style={{ color: perdas > 0 ? 'var(--vs-red)' : '#22C55E' }}>
              {perdas > 0 ? `−${perdas}` : '0'}
            </span>
          </div>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full" style={{ background: 'var(--vs-orange)', color: '#000' }}>
        {loading ? 'Registrando...' : 'Confirmar Retorno'}
      </Button>
    </form>
  );
}
