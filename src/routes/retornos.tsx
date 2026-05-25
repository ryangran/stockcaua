import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos, fetchRetornos } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { RetornoForm } from '../components/retornos/RetornoForm';

export const Route = createFileRoute('/retornos')({
  component: RetornosPage,
});

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const fmtN = (n: number) => n.toLocaleString('pt-BR');

function RetornosPage() {
  const { setProdutos, setRetornos, setIsLoading, retornos } = useStockStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [prods, rets] = await Promise.all([fetchProdutos(), fetchRetornos()]);
        setProdutos(prods);
        setRetornos(rets);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <RetornoForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </div>

      <div className="lg:col-span-3">
        <div className="vs-card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--vs-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>Histórico de Retornos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--vs-border)' }}>
                  {['Data', 'Produto', 'Saiu', 'Voltou', 'Descarte', 'Evento'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retornos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                      Nenhum retorno registrado
                    </td>
                  </tr>
                ) : (
                  retornos.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--vs-border)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">{r.produto?.nome ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{fmtN(r.quantidade_saiu)}</td>
                      <td className="px-4 py-3 tabular-nums text-green-400 font-bold">+{fmtN(r.quantidade_voltou)}</td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: r.quantidade_descartada > 0 ? 'var(--vs-red)' : 'var(--vs-muted)' }}>
                        {r.quantidade_descartada > 0 ? `−${fmtN(r.quantidade_descartada)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{r.evento ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
