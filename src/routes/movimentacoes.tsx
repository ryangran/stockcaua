import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos, fetchMovimentacoes, fetchCompras } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { MovimentacoesTable } from '../components/movimentacoes/MovimentacoesTable';
import { ComprasTab } from '../components/movimentacoes/ComprasTab';
import { usePaste } from '../hooks/usePaste';

export const Route = createFileRoute('/movimentacoes')({
  component: MovimentacoesPage,
});

function MovimentacoesPage() {
  const { setProdutos, setMovimentacoes, setCompras, setIsLoading } = useStockStore();
  const [aba, setAba] = useState<'produtos' | 'compras'>('produtos');
  usePaste(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [prods, movs, compras] = await Promise.all([
          fetchProdutos(),
          fetchMovimentacoes(),
          fetchCompras(),
        ]);
        setProdutos(prods);
        setMovimentacoes(movs);
        setCompras(compras);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}>
        {([
          { id: 'produtos', label: 'Movimentações de Estoque' },
          { id: 'compras', label: 'Compras' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id)}
            className="rounded-md px-4 py-1.5 text-xs font-medium transition-all"
            style={{
              background: aba === tab.id ? 'var(--vs-orange)' : 'transparent',
              color: aba === tab.id ? '#000' : 'var(--vs-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {aba === 'produtos' && <MovimentacoesTable />}
      {aba === 'compras' && <ComprasTab />}
    </div>
  );
}
