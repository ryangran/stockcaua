import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { PackagePlus } from 'lucide-react';
import { useStockStore } from '../../store/useStockStore';
import { registrarMovimentacao, createProduto, updateProduto } from '../../lib/api';
import type { MovimentacaoTipo, PasteRow } from '../../types';

const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function gerarCodigo(nome: string): string {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 5);
  const sufixo = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${iniciais}-${sufixo}`;
}

export function PasteModal({ tipo }: { tipo: MovimentacaoTipo }) {
  const { pasteRows, pasteModalAberto, clearPasteRows, terminalId, upsertProduto, produtos } = useStockStore();
  const [loading, setLoading] = useState(false);
  const [criarNovos, setCriarNovos] = useState(true);

  const validos = pasteRows.filter((r) => r.valido);
  const naoEncontrados = pasteRows.filter((r) => !r.valido && r.erro === 'Não encontrado');
  const totalConfirmar = criarNovos ? validos.length + naoEncontrados.length : validos.length;

  const temFormatoB = pasteRows.some((r) => r.setor !== undefined);

  async function processarRow(row: PasteRow, produtoId: string) {
    // Atualiza categoria/especificacao do produto existente se vieram da planilha
    if (row.setor || row.especificacao) {
      await updateProduto(produtoId, {
        ...(row.setor ? { categoria: row.setor } : {}),
        ...(row.especificacao ? { especificacao: row.especificacao } : {}),
      });
    }
    await registrarMovimentacao({
      produto_id: produtoId,
      tipo: tipo === 'entrada' ? 'ajuste' : 'saida',
      quantidade: row.quantidade,
      motivo: 'Importação via planilha',
      terminal: terminalId,
    });
  }

  async function confirmar() {
    setLoading(true);
    let criados = 0;
    let processados = 0;
    let erros = 0;

    // Processa itens já encontrados — cada um individualmente para não parar no erro
    for (const row of validos) {
      if (!row.produto) continue;
      try {
        await processarRow(row, row.produto.id);
        const delta = tipo === 'entrada' ? row.quantidade : -row.quantidade;
        const prodAtual = produtos.find((p) => p.id === row.produto!.id);
        if (prodAtual) upsertProduto({
          ...prodAtual,
          estoque_atual: prodAtual.estoque_atual + delta,
          ...(row.setor ? { categoria: row.setor } : {}),
          ...(row.especificacao ? { especificacao: row.especificacao } : {}),
        });
        processados++;
      } catch (e) {
        console.error('Erro ao processar:', row.codigo, e);
        erros++;
      }
    }

    // Cria produtos não encontrados com estoque e preço já corretos (sem movimento)
    if (criarNovos) {
      for (const row of naoEncontrados) {
        try {
          const novoProd = await createProduto({
            codigo: gerarCodigo(row.codigo),
            nome: row.codigo,
            unidade: row.unidade_planilha || 'un',
            estoque_atual: row.quantidade,
            estoque_minimo: 0,
            estoque_maximo: 0,
            preco_medio: row.preco_unitario ?? 0,
            categoria: row.setor || null,
            especificacao: row.especificacao || null,
          });
          upsertProduto(novoProd);
          criados++;
          processados++;
        } catch (e) {
          console.error('Erro ao criar produto:', row.codigo, e);
          erros++;
        }
      }
    }

    setLoading(false);

    if (erros === 0) {
      const msg = criados > 0
        ? `${processados} itens importados (${criados} produtos criados automaticamente)`
        : `${processados} movimentações registradas`;
      toast.success(msg);
    } else {
      toast.warning(`${processados} importados, ${erros} com erro — veja o console`);
    }
    clearPasteRows();
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
            Importar planilha — {validos.length} existentes / {naoEncontrados.length} novos
          </DialogTitle>
        </DialogHeader>

        {/* Toggle criar novos */}
        {naoEncontrados.length > 0 && (
          <button
            onClick={() => setCriarNovos((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-left transition-colors"
            style={{
              background: criarNovos ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${criarNovos ? 'rgba(249,115,22,0.3)' : 'var(--vs-border)'}`,
            }}
          >
            <div
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
              style={{
                background: criarNovos ? 'var(--vs-orange)' : 'transparent',
                border: `1.5px solid ${criarNovos ? 'var(--vs-orange)' : 'var(--vs-muted)'}`,
              }}
            >
              {criarNovos && <span style={{ color: '#000', fontSize: 10, fontWeight: 900 }}>✓</span>}
            </div>
            <PackagePlus size={13} style={{ color: 'var(--vs-orange)' }} />
            <span style={{ color: '#fff' }}>
              Criar automaticamente os <strong>{naoEncontrados.length} produtos não encontrados</strong>
            </span>
            <span style={{ color: 'var(--vs-muted)' }}>— código gerado automaticamente, você pode editar depois</span>
          </button>
        )}

        <div className="max-h-80 overflow-y-auto overflow-x-auto">
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
                    {th('Status')}
                  </>
                ) : (
                  <>
                    {th('Código / Nome')}
                    {th('Qtd')}
                    {th('Status')}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {pasteRows.map((row, i) => {
                const seraProcessado = row.valido || (criarNovos && row.erro === 'Não encontrado');
                return (
                  <tr
                    key={i}
                    className="border-t"
                    style={{ borderColor: 'var(--vs-border)', opacity: seraProcessado ? 1 : 0.4 }}
                  >
                    {temFormatoB ? (
                      <>
                        <td className="py-1.5 pr-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{row.setor || '—'}</td>
                        <td className="py-1.5 pr-3 text-xs font-medium">{row.codigo}</td>
                        <td className="py-1.5 pr-3 text-xs" style={{ color: 'var(--vs-muted)', maxWidth: 140 }} title={row.especificacao}>
                          <span className="block truncate">{row.especificacao || '—'}</span>
                        </td>
                        <td className="py-1.5 pr-3 text-xs tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>
                          {row.quantidade}
                        </td>
                        <td className="py-1.5 pr-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{row.unidade_planilha || '—'}</td>
                        <td className="py-1.5 pr-3 text-xs tabular-nums">{row.valor_total != null ? fmtR$(row.valor_total) : '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-1.5 pr-3 font-mono text-xs">{row.codigo}</td>
                        <td className="py-1.5 pr-3 text-xs tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>{row.quantidade}</td>
                      </>
                    )}
                    <td className="py-1.5">
                      {row.valido ? (
                        <span className="vs-badge-ok rounded px-2 py-0.5 text-xs">Existente</span>
                      ) : row.erro === 'Não encontrado' && criarNovos ? (
                        <span className="rounded px-2 py-0.5 text-xs" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--vs-orange)', border: '1px solid rgba(249,115,22,0.3)' }}>
                          Criar novo
                        </span>
                      ) : (
                        <span className="vs-badge-critical rounded px-2 py-0.5 text-xs">{row.erro}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter className="flex items-center">
          <Button variant="ghost" onClick={clearPasteRows} disabled={loading}>Cancelar</Button>
          <Button
            onClick={confirmar}
            disabled={loading || totalConfirmar === 0}
            style={{ background: 'var(--vs-orange)', color: '#000' }}
          >
            {loading ? 'Processando...' : `Confirmar ${totalConfirmar} itens`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
