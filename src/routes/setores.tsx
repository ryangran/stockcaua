import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { SetoresPage } from '../components/setores/SetoresPage';

export const Route = createFileRoute('/setores')({
  component: Page,
});

function Page() {
  const { setProdutos, setIsLoading } = useStockStore();

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

  return <SetoresPage />;
}
