import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useStockStore } from '../../store/useStockStore';
import { registrarMovimentacao } from '../../lib/api';
import type { MovimentacaoTipo } from '../../types';

export function PasteModal({ tipo }: { tipo: MovimentacaoTipo }) {
  const { pasteRows, pasteModalAberto, clearPasteRows, terminalId, upsertProduto, produtos } = useStockStore();
  const [loading, setLoading] = useState(false);

  const validos = pasteRows.filter((r) => r.valido);
  const invalidos = pasteRows.filter((r) => !r.valido);

  async function confirmar() {
    setLoading(true);
    try {
      for (const row of validos) {
        if (!row.produto) continue;
        await registrarMovimentacao({
          produto_id: row.produto.id,
          tipo: tipo === 'entrada' ? 'ajuste' : 'saida',
          quantidade: row.quantidade,
          motivo: 'Importação via paste',
          terminal: terminalId,
        });
        // Atualizar store localmente
        const delta = tipo === 'entrada' ? row.quantidade : -row.quantidade;
        const prodAtual = produtos.find((p) => p.id === row.produto!.id);
        if (prodAtual) {
          upsertProduto({ ...prodAtual, estoque_atual: prodAtual.estoque_atual + delta });
        }
      }
      toast.success(`${validos.length} movimentações registradas`);
      clearPasteRows();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={pasteModalAberto} onOpenChange={(o) => !o && clearPasteRows()}>
      <DialogContent className="max-w-2xl" style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--vs-orange)' }}>
            Importar via Paste — {validos.length} válidos / {invalidos.length} inválidos
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ color: 'var(--vs-muted)' }}>
                <th className="pb-2 pr-4">Código/Nome</th>
                <th className="pb-2 pr-4">Produto encontrado</th>
                <th className="pb-2 pr-4">Qtd</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pasteRows.map((row, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--vs-border)' }}>
                  <td className="py-1.5 pr-4 font-mono text-xs">{row.codigo}</td>
                  <td className="py-1.5 pr-4">{row.produto?.nome ?? '—'}</td>
                  <td className="py-1.5 pr-4">{row.quantidade}</td>
                  <td className="py-1.5">
                    {row.valido ? (
                      <Badge className="vs-badge-ok text-xs">OK</Badge>
                    ) : (
                      <Badge className="vs-badge-critical text-xs">{row.erro}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={clearPasteRows} disabled={loading}>Cancelar</Button>
          <Button
            onClick={confirmar}
            disabled={loading || validos.length === 0}
            style={{ background: 'var(--vs-orange)', color: '#000' }}
          >
            {loading ? 'Processando...' : `Confirmar ${validos.length} itens`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
