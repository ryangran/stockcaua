import type { Produto, EstoqueStatus } from '../../types';

function getStatus(produto: Produto): EstoqueStatus {
  if (produto.estoque_minimo <= 0) return 'ok';
  if (produto.estoque_atual <= produto.estoque_minimo * 0.5) return 'critico';
  if (produto.estoque_atual <= produto.estoque_minimo) return 'baixo';
  return 'ok';
}

const config: Record<EstoqueStatus, { label: string; cls: string; dot: string }> = {
  ok:      { label: 'OK',      cls: 'vs-badge-ok',       dot: '#22C55E' },
  baixo:   { label: 'Baixo',   cls: 'vs-badge-low',      dot: 'var(--vs-orange)' },
  critico: { label: 'Crítico', cls: 'vs-badge-critical',  dot: 'var(--vs-red)' },
};

export function StatusBadge({ produto }: { produto: Produto }) {
  const status = getStatus(produto);
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      <span className="size-1.5 rounded-full animate-pulse" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

export function StatusDot({ produto }: { produto: Produto }) {
  const status = getStatus(produto);
  const c = config[status];
  return <span className="size-2 rounded-full inline-block" style={{ background: c.dot }} title={c.label} />;
}

export { getStatus };
