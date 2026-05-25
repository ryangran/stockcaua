import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProdutos, exportarNecessidadesCSV } from '../lib/api';
import { useStockStore } from '../store/useStockStore';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Download, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/necessidades')({
  component: NecessidadesPage,
});

const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function NecessidadesPage() {
  const { setProdutos, setIsLoading, necessidades, produtos } = useStockStore();

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} style={{ color: 'var(--vs-red)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--vs-red)' }}>
            {necessidades.length} produto{necessidades.length !== 1 ? 's' : ''} abaixo do mínimo
          </span>
        </div>
        <Button
          onClick={() => exportarNecessidadesCSV(produtos)}
          variant="outline"
          size="sm"
          style={{ borderColor: 'var(--vs-border)', color: 'var(--vs-muted)' }}
        >
          <Download size={13} className="mr-1.5" /> Exportar CSV
        </Button>
      </div>

      {necessidades.length === 0 ? (
        <div className="vs-card flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl">✅</div>
          <p className="text-sm font-medium" style={{ color: '#22C55E' }}>Todos os estoques dentro do limite</p>
          <p className="text-xs" style={{ color: 'var(--vs-muted)' }}>Nenhum produto abaixo do estoque mínimo</p>
        </div>
      ) : (
        <div className="vs-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--vs-border)' }}>
                  {['Prioridade', 'Código', 'Produto', 'Atual', 'Mínimo', 'Déficit', 'Custo reposição', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {necessidades.map(({ produto: p, deficit, prioridade }, i) => (
                  <tr key={p.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--vs-border)' }}>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex size-6 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: prioridade === 'alta' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                          color: prioridade === 'alta' ? 'var(--vs-red)' : 'var(--vs-orange)',
                        }}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--vs-muted)' }}>{p.codigo}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.nome}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--vs-red)' }}>{p.estoque_atual} {p.unidade}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--vs-muted)' }}>{p.estoque_minimo} {p.unidade}</td>
                    <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-red)' }}>−{deficit} {p.unidade}</td>
                    <td className="px-4 py-3 tabular-nums text-xs">{fmtR$(deficit * p.preco_medio)}</td>
                    <td className="px-4 py-3"><StatusBadge produto={p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
