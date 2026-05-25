import { useStockStore } from '../../store/useStockStore';

export function TopProdutos() {
  const movimentacoes = useStockStore((s) => s.movimentacoes);
  const produtos = useStockStore((s) => s.produtos);

  // Contar movimentações por produto (últimas 200)
  const contagem: Record<string, number> = {};
  for (const m of movimentacoes) {
    contagem[m.produto_id] = (contagem[m.produto_id] ?? 0) + m.quantidade;
  }

  const top5 = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => ({
      produto: produtos.find((p) => p.id === id),
      total,
    }))
    .filter((x) => x.produto);

  const max = top5[0]?.total ?? 1;

  return (
    <div className="vs-card p-5">
      <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>
        Top 5 — Mais Movimentados
      </h3>

      {top5.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--vs-muted)' }}>Sem dados de movimentação</p>
      ) : (
        <div className="space-y-3">
          {top5.map(({ produto, total }, i) => (
            <div key={produto!.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--vs-muted)', width: 14 }}>
                    {i + 1}
                  </span>
                  <span className="truncate max-w-[140px]">{produto!.nome}</span>
                </span>
                <span className="tabular-nums text-xs font-semibold" style={{ color: 'var(--vs-orange)' }}>
                  {total.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--vs-border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(total / max) * 100}%`,
                    background: i === 0 ? 'var(--vs-orange)' : i === 1 ? 'var(--vs-red)' : 'var(--vs-muted)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
