import { useStockStore } from '../../store/useStockStore';
import type { Compra } from '../../types';

const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function ComprasHistorico() {
  const compras = useStockStore((s) => s.compras);

  return (
    <div className="vs-card overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--vs-border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>Histórico de Compras</h3>
      </div>
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
                <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                  Nenhuma compra registrada
                </td>
              </tr>
            ) : (
              compras.map((c: Compra) => (
                <tr key={c.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--vs-border)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{c.produto?.nome ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{c.quantidade} <span className="text-xs" style={{ color: 'var(--vs-muted)' }}>{c.produto?.unidade}</span></td>
                  <td className="px-4 py-3 tabular-nums">{fmtR$(c.preco_unitario)}</td>
                  <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>{fmtR$(c.preco_total)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{c.fornecedor ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
