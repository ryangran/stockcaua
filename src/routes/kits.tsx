import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos, fetchKits, fetchProducoes } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { KitsList } from '../components/kits/KitsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const Route = createFileRoute('/kits')({
  component: KitsPage,
});

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function KitsPage() {
  const { setProdutos, setKits, setProducoes, setIsLoading, producoes, kits } = useStockStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [prods, kitsData, producoesDados] = await Promise.all([
          fetchProdutos(), fetchKits(), fetchProducoes(),
        ]);
        setProdutos(prods);
        setKits(kitsData);
        setProducoes(producoesDados);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  return (
    <Tabs defaultValue="kits">
      <TabsList style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}>
        <TabsTrigger value="kits" style={{ color: 'var(--vs-muted)' }}>Kits ({kits.length})</TabsTrigger>
        <TabsTrigger value="historico" style={{ color: 'var(--vs-muted)' }}>Histórico ({producoes.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="kits" className="mt-5">
        <KitsList onProducao={() => setRefreshKey((k) => k + 1)} />
      </TabsContent>

      <TabsContent value="historico" className="mt-5">
        <div className="vs-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--vs-border)' }}>
                  {['Data', 'Kit', 'Quantidade', 'Terminal'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {producoes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                      Nenhuma produção registrada
                    </td>
                  </tr>
                ) : (
                  producoes.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--vs-border)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3 font-medium">{p.kit?.nome ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>×{p.quantidade}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--vs-muted)' }}>{p.terminal ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
