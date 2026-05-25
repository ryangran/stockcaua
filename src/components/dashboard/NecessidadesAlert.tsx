import { Link } from '@tanstack/react-router';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useStockStore } from '../../store/useStockStore';

export function NecessidadesAlert() {
  const necessidades = useStockStore((s) => s.necessidades);
  const top = necessidades.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="vs-card p-5">
        <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>
          Alertas de Reposição
        </h3>
        <p className="text-sm" style={{ color: 'var(--vs-muted)' }}>
          Todos os estoques estão dentro do limite mínimo.
        </p>
      </div>
    );
  }

  return (
    <div className="vs-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--vs-red)' }}>
          <AlertTriangle size={14} />
          Reposição necessária ({necessidades.length})
        </h3>
        <Link to="/necessidades" className="flex items-center gap-1 text-xs transition-colors hover:opacity-80" style={{ color: 'var(--vs-orange)' }}>
          Ver todos <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-2">
        {top.map(({ produto, deficit, prioridade }) => (
          <div
            key={produto.id}
            className="flex items-center justify-between rounded-md px-3 py-2"
            style={{ background: 'var(--vs-surface-2)', border: `1px solid ${prioridade === 'alta' ? 'rgba(239,68,68,0.3)' : 'var(--vs-border)'}` }}
          >
            <div>
              <div className="text-sm font-medium">{produto.nome}</div>
              <div className="text-xs" style={{ color: 'var(--vs-muted)' }}>
                {produto.estoque_atual} / mín {produto.estoque_minimo} {produto.unidade}
              </div>
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: prioridade === 'alta' ? 'var(--vs-red)' : 'var(--vs-orange)' }}
            >
              −{deficit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
