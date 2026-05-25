import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { ProdutosTable } from '../components/produtos/ProdutosTable';
import { usePaste } from '../hooks/usePaste';

export const Route = createFileRoute('/produtos')({
  component: ProdutosPage,
});

function ProdutosPage() {
  const { setProdutos, setIsLoading } = useStockStore();
  usePaste(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const prods = await fetchProdutos();
        setProdutos(prods);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return <ProdutosTable />;
}
