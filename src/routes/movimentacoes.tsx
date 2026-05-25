import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos, fetchMovimentacoes } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { MovimentacoesTable } from '../components/movimentacoes/MovimentacoesTable';
import { usePaste } from '../hooks/usePaste';

export const Route = createFileRoute('/movimentacoes')({
  component: MovimentacoesPage,
});

function MovimentacoesPage() {
  const { setProdutos, setMovimentacoes, setIsLoading } = useStockStore();
  usePaste(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [prods, movs] = await Promise.all([fetchProdutos(), fetchMovimentacoes()]);
        setProdutos(prods);
        setMovimentacoes(movs);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return <MovimentacoesTable />;
}
