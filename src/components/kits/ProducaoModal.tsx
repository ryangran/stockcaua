import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { registrarProducao, validarProducao } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { Kit } from '../../types';

interface Props { open: boolean; onClose: () => void; kit: Kit; onSuccess: () => void; }

export function ProducaoModal({ open, onClose, kit, onSuccess }: Props) {
  const { upsertProduto, produtos, terminalId, addProducao } = useStockStore();
  const [quantidade, setQuantidade] = useState('1');
  const [loading, setLoading] = useState(false);

  const qtd = parseInt(quantidade) || 0;
  const validacao = qtd > 0 ? validarProducao(kit, qtd) : { valido: false, erros: [] };

  async function confirmar() {
    if (!validacao.valido) return;
    setLoading(true);
    try {
      const prod = await registrarProducao({ kit, quantidade: qtd, terminal: terminalId });
      addProducao(prod);

      // Atualizar store localmente para cada componente
      for (const item of kit.itens ?? []) {
        const p = produtos.find((x) => x.id === item.produto_id);
        if (p) upsertProduto({ ...p, estoque_atual: p.estoque_atual - item.quantidade * qtd });
      }

      toast.success(`${qtd}x "${kit.nome}" produzido(s)`);
      onSuccess();
      onClose();
      setQuantidade('1');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro na produção');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', maxWidth: 460 }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--vs-orange)' }}>Produzir — {kit.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Quantidade a produzir</Label>
            <Input
              type="number" min="1" value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)', color: '#fff' }}
            />
          </div>

          {/* Componentes + validação */}
          {qtd > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--vs-muted)' }}>Consumo de componentes:</p>
              {kit.itens?.map((item) => {
                const necessario = item.quantidade * qtd;
                const disponivel = item.produto?.estoque_atual ?? 0;
                const ok = disponivel >= necessario;
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                    style={{ background: 'var(--vs-surface-2)', border: `1px solid ${ok ? 'var(--vs-border)' : 'rgba(239,68,68,0.4)'}` }}>
                    <span className="truncate max-w-[200px]">{item.produto?.nome}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums text-xs" style={{ color: ok ? '#22C55E' : 'var(--vs-red)' }}>
                        {disponivel} → {disponivel - necessario}
                      </span>
                      {ok ? <CheckCircle size={13} color="#22C55E" /> : <AlertTriangle size={13} color="var(--vs-red)" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!validacao.valido && validacao.erros.length > 0 && (
            <div className="rounded-md p-3 text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--vs-red)' }}>
              <p className="font-semibold mb-1">Estoque insuficiente:</p>
              {validacao.erros.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button
            onClick={confirmar}
            disabled={loading || !validacao.valido || qtd <= 0}
            style={{ background: 'var(--vs-orange)', color: '#000' }}
          >
            {loading ? 'Produzindo...' : `Confirmar ${qtd}x`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
