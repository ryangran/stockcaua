import { useStockStore } from '../../store/useStockStore';
import { ImportarPlanilha } from '../shared/ImportarPlanilha';
import { PasteModal } from '../shared/PasteModal';
import type { Compra } from '../../types';

const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function ComprasTab() {
  const compras = useStockStore((s) => s.compras);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ImportarPlanilha />
        <span className="text-xs ml-auto" style={{ color: 'var(--vs-muted)' }}>
          Importe a planilha do fornecedor para registrar as compras
        </span>
      </div>

      <div className="vs-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--vs-border)' }}>
                {['Data', 'Produto', 'Qtd', 'Preço Unit.', 'Total', 'Fornecedor'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                    Nenhuma compra registrada — importe uma planilha do fornecedor
                  </td>
                </tr>
              ) : (
                compras.map((c: Compra) => (
                  <tr key={c.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--vs-border)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{c.produto?.nome ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>
                      {c.quantidade} <span className="text-xs font-normal" style={{ color: 'var(--vs-muted)' }}>{c.produto?.unidade}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs">{fmtR$(c.preco_unitario)}</td>
                    <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>{fmtR$(c.preco_total)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{c.fornecedor ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 text-xs" style={{ color: 'var(--vs-muted)', borderTop: '1px solid var(--vs-border)' }}>
          {compras.length} compra{compras.length !== 1 ? 's' : ''} registrada{compras.length !== 1 ? 's' : ''}
        </div>
      </div>

      <PasteModal tipo="entrada" />
    </div>
  );
}
