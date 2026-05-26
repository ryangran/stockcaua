import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { useStockStore } from '../../store/useStockStore';
import { registrarMovimentacao } from '../../lib/api';
import type { MovimentacaoTipo } from '../../types';

const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PasteModal({ tipo }: { tipo: MovimentacaoTipo }) {
  const { pasteRows, pasteModalAberto, clearPasteRows, terminalId, upsertProduto, produtos } = useStockStore();
  const [loading, setLoading] = useState(false);

  const validos = pasteRows.filter((r) => r.valido);
  const invalidos = pasteRows.filter((r) => !r.valido);

  // Detecta se vieram dados da planilha com colunas extras
  const temFormatoB = pasteRows.some((r) => r.setor !== undefined);

  async function confirmar() {
    setLoading(true);
    try {
      for (const row of validos) {
        if (!row.produto) continue;
        await registrarMovimentacao({
          produto_id: row.produto.id,
          tipo: tipo === 'entrada' ? 'ajuste' : 'saida',
          quantidade: row.quantidade,
          motivo: 'Importação via planilha',
          terminal: terminalId,
        });
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

  const th = (label: string) => (
    <th className="pb-2 pr-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--vs-muted)' }}>
      {label}
    </th>
  );

  return (
    <Dialog open={pasteModalAberto} onOpenChange={(o) => !o && clearPasteRows()}>
      <DialogContent
        className="max-w-4xl"
        style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--vs-orange)', fontSize: 14 }}>
            Importar planilha — {validos.length} válidos / {invalidos.length} inválidos
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {temFormatoB ? (
                  <>
                    {th('Setor')}
                    {th('Produto')}
                    {th('Especificação')}
                    {th('Qtd')}
                    {th('Unid')}
                    {th('Valor Total')}
                    {th('Encontrado')}
                    {th('Status')}
                  </>
                ) : (
                  <>
                    {th('Código / Nome')}
                    {th('Qtd')}
                    {th('Encontrado')}
                    {th('Status')}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {pasteRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t"
                  style={{ borderColor: 'var(--vs-border)', opacity: row.valido ? 1 : 0.5 }}
                >
                  {temFormatoB ? (
                    <>
                      <td className="py-1.5 pr-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{row.setor || '—'}</td>
                      <td className="py-1.5 pr-3 text-xs font-medium">{row.codigo}</td>
                      <td className="py-1.5 pr-3 text-xs" style={{ color: 'var(--vs-muted)', maxWidth: 160 }} title={row.especificacao}>
                        <span className="block truncate">{row.especificacao || '—'}</span>
                      </td>
                      <td className="py-1.5 pr-3 text-xs tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>
                        {row.quantidade}
                      </td>
                      <td className="py-1.5 pr-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{row.unidade_planilha || '—'}</td>
                      <td className="py-1.5 pr-3 text-xs tabular-nums">{row.valor_total != null ? fmtR$(row.valor_total) : '—'}</td>
                      <td className="py-1.5 pr-3 text-xs">{row.produto?.nome ?? '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-1.5 pr-3 font-mono text-xs">{row.codigo}</td>
                      <td className="py-1.5 pr-3 text-xs tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>{row.quantidade}</td>
                      <td className="py-1.5 pr-3 text-xs">{row.produto?.nome ?? '—'}</td>
                    </>
                  )}
                  <td className="py-1.5">
                    {row.valido ? (
                      <span className="vs-badge-ok rounded px-2 py-0.5 text-xs">OK</span>
                    ) : (
                      <span className="vs-badge-critical rounded px-2 py-0.5 text-xs">{row.erro}</span>
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
