import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos, fetchMovimentacoes, fetchDashboardStats, fetchMovimentacoesPorDia } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { StatsCards } from '../components/dashboard/StatsCards';
import { MovimentacaoChart } from '../components/dashboard/MovimentacaoChart';
import { NecessidadesAlert } from '../components/dashboard/NecessidadesAlert';
import { TopProdutos } from '../components/dashboard/TopProdutos';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const {
    setProdutos, setMovimentacoes, setDashboardStats,
    setMovimentacoesPorDia, setIsLoading, produtos,
  } = useStockStore();

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [prods, movs, diasData] = await Promise.all([
          fetchProdutos(),
          fetchMovimentacoes(),
          fetchMovimentacoesPorDia(),
        ]);
        setProdutos(prods);
        setMovimentacoes(movs);
        setMovimentacoesPorDia(diasData);
        const stats = await fetchDashboardStats(prods);
        setDashboardStats(stats);
      } catch (err) {
        console.error('[Dashboard] Erro ao carregar:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MovimentacaoChart />
        </div>
        <div>
          <NecessidadesAlert />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProdutos />
        {/* Placeholder para futuros widgets */}
        <div className="vs-card p-5 flex items-center justify-center" style={{ color: 'var(--vs-muted)', minHeight: 180 }}>
          <span className="text-sm">Mais métricas em breve...</span>
        </div>
      </div>
    </div>
  );
}
