import { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { StatusBadge } from '../shared/StatusBadge';
import { Search, Layers, ChevronRight, Package } from 'lucide-react';
import { Input } from '../ui/input';
import type { Produto } from '../../types';

const fmtR$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function getEstoqueStatus(p: Produto) {
  if (p.estoque_atual <= p.estoque_minimo * 0.5 && p.estoque_minimo > 0) return 'critico';
  if (p.estoque_atual <= p.estoque_minimo && p.estoque_minimo > 0) return 'baixo';
  return 'ok';
}

export function SetoresPage() {
  const produtos = useStockStore((s) => s.produtos);
  const [setorSelecionado, setSetorSelecionado] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Monta lista de setores com contagens
  const setoresMap = new Map<string, Produto[]>();
  for (const p of produtos) {
    const setor = p.categoria?.trim() || '(Sem setor)';
    if (!setoresMap.has(setor)) setoresMap.set(setor, []);
    setoresMap.get(setor)!.push(p);
  }
  const setores = Array.from(setoresMap.entries()).sort(([a], [b]) => {
    if (a === '(Sem setor)') return 1;
    if (b === '(Sem setor)') return -1;
    return a.localeCompare(b);
  });

  const produtosDoSetor = setorSelecionado != null
    ? (setoresMap.get(setorSelecionado) ?? [])
    : [];

  const produtosFiltrados = busca.trim()
    ? produtosDoSetor.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        (p.especificacao ?? '').toLowerCase().includes(busca.toLowerCase())
      )
    : produtosDoSetor;

  const valorTotalSetor = produtosDoSetor.reduce((s, p) => s + p.estoque_atual * p.preco_medio, 0);

  return (
    <div className="flex gap-4 h-full" style={{ minHeight: 0 }}>
      {/* Painel esquerdo — lista de setores */}
      <div
        className="flex flex-col shrink-0 rounded-xl overflow-hidden"
        style={{ width: 260, background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}
      >
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--vs-border)' }}>
          <div className="flex items-center gap-2">
            <Layers size={14} style={{ color: 'var(--vs-orange)' }} />
            <span className="text-sm font-semibold">Setores</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--vs-muted)' }}>{setores.length} setores encontrados</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {setores.map(([setor, prods]) => {
            const ativo = setorSelecionado === setor;
            const criticos = prods.filter((p) => getEstoqueStatus(p) === 'critico').length;
            return (
              <button
                key={setor}
                onClick={() => { setSetorSelecionado(ativo ? null : setor); setBusca(''); }}
                className="w-full text-left px-4 py-3 flex items-center gap-2 transition-colors"
                style={{
                  background: ativo ? 'rgba(249,115,22,0.1)' : 'transparent',
                  borderLeft: ativo ? '2px solid var(--vs-orange)' : '2px solid transparent',
                  borderBottom: '1px solid var(--vs-border)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: ativo ? 'var(--vs-orange)' : '#fff' }}
                  >
                    {setor}
                  </div>
                  <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--vs-muted)' }}>
                    <span>{prods.length} produto{prods.length !== 1 ? 's' : ''}</span>
                    {criticos > 0 && (
                      <span className="rounded px-1 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--vs-red)' }}>
                        {criticos} crítico{criticos !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={13} style={{ color: 'var(--vs-muted)', flexShrink: 0, transform: ativo ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel direito — produtos do setor */}
      <div className="flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden" style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}>
        {setorSelecionado == null ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--vs-muted)' }}>
            <Layers size={40} style={{ opacity: 0.2 }} />
            <p className="text-sm">Selecione um setor para ver os produtos</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 shrink-0 flex flex-wrap items-center gap-4" style={{ borderBottom: '1px solid var(--vs-border)' }}>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold truncate" style={{ color: 'var(--vs-orange)' }}>{setorSelecionado}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--vs-muted)' }}>
                  {produtosDoSetor.length} produto{produtosDoSetor.length !== 1 ? 's' : ''} · Valor total em estoque: <span style={{ color: '#fff' }}>{fmtR$(valorTotalSetor)}</span>
                </p>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vs-muted)' }} />
                <Input
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8 h-8 text-xs w-52"
                  style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)', color: '#fff' }}
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--vs-border)' }}>
                    {['Produto', 'Especificação', 'Qtd', 'Unidade', 'Vlr Unitário', 'Valor Total', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--vs-muted)' }}>
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  ) : (
                    produtosFiltrados.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--vs-border)' }}>
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="font-medium truncate">{p.nome}</div>
                          <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--vs-muted)' }}>{p.codigo}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] text-xs" style={{ color: 'var(--vs-muted)' }}>
                          {p.especificacao
                            ? <span className="truncate block" title={p.especificacao}>{p.especificacao}</span>
                            : <span style={{ color: 'var(--vs-border)' }}>—</span>
                          }
                        </td>
                        <td className="px-4 py-3 tabular-nums font-bold" style={{ color: 'var(--vs-orange)' }}>
                          {p.estoque_atual}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--vs-muted)' }}>{p.unidade}</td>
                        <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--vs-muted)' }}>{fmtR$(p.preco_medio)}</td>
                        <td className="px-4 py-3 tabular-nums text-xs">{fmtR$(p.estoque_atual * p.preco_medio)}</td>
                        <td className="px-4 py-3"><StatusBadge produto={p} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 shrink-0 text-xs flex items-center gap-1" style={{ borderTop: '1px solid var(--vs-border)', color: 'var(--vs-muted)' }}>
              <Package size={11} />
              <span>{produtosFiltrados.length} de {produtosDoSetor.length} produto{produtosDoSetor.length !== 1 ? 's' : ''}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
