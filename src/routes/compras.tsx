import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos, fetchCompras } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { CompraForm } from '../components/compras/CompraForm';
import { ComprasHistorico } from '../components/compras/ComprasHistorico';

export const Route = createFileRoute('/compras')({
  component: ComprasPage,
});

function ComprasPage() {
  const { setProdutos, setCompras, setIsLoading } = useStockStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [prods, compras] = await Promise.all([fetchProdutos(), fetchCompras()]);
        setProdutos(prods);
        setCompras(compras);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <CompraForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </div>
      <div className="lg:col-span-3">
        <ComprasHistorico />
      </div>
    </div>
  );
}
