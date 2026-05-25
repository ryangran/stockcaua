import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Produto,
  Movimentacao,
  Compra,
  Kit,
  Producao,
  Retorno,
  DashboardStats,
  MovimentacaoDia,
  Terminal,
  PasteRow,
  Tema,
  EstoqueStatus,
  ProdutoNecessidade,
} from '../types';

function getEstoqueStatus(produto: Produto): EstoqueStatus {
  if (produto.estoque_atual <= produto.estoque_minimo * 0.5) return 'critico';
  if (produto.estoque_atual <= produto.estoque_minimo) return 'baixo';
  return 'ok';
}

function calcularNecessidades(produtos: Produto[]): ProdutoNecessidade[] {
  return produtos
    .filter((p) => p.estoque_atual < p.estoque_minimo)
    .map((p) => {
      const deficit = p.estoque_minimo - p.estoque_atual;
      const status = getEstoqueStatus(p);
      return {
        produto: p,
        deficit,
        prioridade: (status === 'critico' ? 'alta' : 'media') as 'alta' | 'media' | 'baixa',
        dias_restantes: null,
      };
    })
    .sort((a, b) => b.deficit - a.deficit);
}

interface StockState {
  // Dados
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  compras: Compra[];
  kits: Kit[];
  producoes: Producao[];
  retornos: Retorno[];

  // Dashboard
  dashboardStats: DashboardStats;
  movimentacoesPorDia: MovimentacaoDia[];

  // Necessidades
  necessidades: ProdutoNecessidade[];

  // UI / Tema
  tema: Tema;
  terminalId: string;
  terminaisAtivos: Terminal[];
  isLoading: boolean;
  globalError: string | null;

  // Paste inteligente
  pasteRows: PasteRow[];
  pasteModalAberto: boolean;

  // Filtros da listagem de produtos
  filtro: {
    busca: string;
    status: EstoqueStatus | 'todos';
  };

  // Actions — Produtos
  setProdutos: (produtos: Produto[]) => void;
  upsertProduto: (produto: Produto) => void;
  removeProduto: (id: string) => void;

  // Actions — Movimentações
  setMovimentacoes: (movs: Movimentacao[]) => void;
  addMovimentacao: (mov: Movimentacao) => void;

  // Actions — Compras
  setCompras: (compras: Compra[]) => void;
  addCompra: (compra: Compra) => void;

  // Actions — Kits
  setKits: (kits: Kit[]) => void;
  upsertKit: (kit: Kit) => void;
  removeKit: (id: string) => void;

  // Actions — Produções
  setProducoes: (producoes: Producao[]) => void;
  addProducao: (producao: Producao) => void;

  // Actions — Retornos
  setRetornos: (retornos: Retorno[]) => void;
  addRetorno: (retorno: Retorno) => void;

  // Actions — UI
  setTema: (tema: Tema) => void;
  toggleTema: () => void;
  setTerminaisAtivos: (terminais: Terminal[]) => void;
  setIsLoading: (loading: boolean) => void;
  setGlobalError: (error: string | null) => void;

  // Actions — Paste
  setPasteRows: (rows: PasteRow[]) => void;
  setPasteModalAberto: (aberto: boolean) => void;
  clearPasteRows: () => void;

  // Actions — Filtros
  setFiltro: (filtro: Partial<StockState['filtro']>) => void;

  // Actions — Dashboard
  setDashboardStats: (stats: DashboardStats) => void;
  setMovimentacoesPorDia: (dados: MovimentacaoDia[]) => void;

  // Selectors computados
  getProdutoById: (id: string) => Produto | undefined;
  getProdutosFiltrados: () => Produto[];
  getEstoqueStatus: (produto: Produto) => EstoqueStatus;
}

const TEMA_KEY = 'stockos_tema';
const TERMINAL_KEY = 'stockos_terminal_id';

// Guard: localStorage and document don't exist during SSR (Cloudflare Workers)
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function safeLocalGet(key: string): string | null {
  if (!isBrowser) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeLocalSet(key: string, value: string): void {
  if (!isBrowser) return;
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function getTerminalId(): string {
  const stored = safeLocalGet(TERMINAL_KEY);
  if (stored) return stored;
  const id = `terminal_${Math.random().toString(36).slice(2, 10)}`;
  safeLocalSet(TERMINAL_KEY, id);
  return id;
}

export const useStockStore = create<StockState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    produtos: [],
    movimentacoes: [],
    compras: [],
    kits: [],
    producoes: [],
    retornos: [],
    dashboardStats: { total_skus: 0, valor_total_estoque: 0, itens_criticos: 0, giro_medio: 0 },
    movimentacoesPorDia: [],
    necessidades: [],
    tema: (safeLocalGet(TEMA_KEY) as Tema) ?? 'dark',
    terminalId: getTerminalId(),
    terminaisAtivos: [],
    isLoading: false,
    globalError: null,
    pasteRows: [],
    pasteModalAberto: false,
    filtro: { busca: '', status: 'todos' },

    // Produtos
    setProdutos: (produtos) =>
      set({ produtos, necessidades: calcularNecessidades(produtos) }),

    upsertProduto: (produto) =>
      set((state) => {
        const exists = state.produtos.findIndex((p) => p.id === produto.id);
        const updated =
          exists >= 0
            ? state.produtos.map((p) => (p.id === produto.id ? produto : p))
            : [...state.produtos, produto];
        return { produtos: updated, necessidades: calcularNecessidades(updated) };
      }),

    removeProduto: (id) =>
      set((state) => {
        const updated = state.produtos.filter((p) => p.id !== id);
        return { produtos: updated, necessidades: calcularNecessidades(updated) };
      }),

    // Movimentações
    setMovimentacoes: (movimentacoes) => set({ movimentacoes }),
    addMovimentacao: (mov) =>
      set((state) => ({ movimentacoes: [mov, ...state.movimentacoes] })),

    // Compras
    setCompras: (compras) => set({ compras }),
    addCompra: (compra) =>
      set((state) => ({ compras: [compra, ...state.compras] })),

    // Kits
    setKits: (kits) => set({ kits }),
    upsertKit: (kit) =>
      set((state) => {
        const exists = state.kits.findIndex((k) => k.id === kit.id);
        const updated =
          exists >= 0
            ? state.kits.map((k) => (k.id === kit.id ? kit : k))
            : [...state.kits, kit];
        return { kits: updated };
      }),
    removeKit: (id) =>
      set((state) => ({ kits: state.kits.filter((k) => k.id !== id) })),

    // Produções
    setProducoes: (producoes) => set({ producoes }),
    addProducao: (producao) =>
      set((state) => ({ producoes: [producao, ...state.producoes] })),

    // Retornos
    setRetornos: (retornos) => set({ retornos }),
    addRetorno: (retorno) =>
      set((state) => ({ retornos: [retorno, ...state.retornos] })),

    // UI
    setTema: (tema) => {
      safeLocalSet(TEMA_KEY, tema);
      if (isBrowser) document.documentElement.setAttribute('data-tema', tema);
      set({ tema });
    },
    toggleTema: () => {
      const { tema, setTema } = get();
      setTema(tema === 'dark' ? 'neon' : 'dark');
    },
    setTerminaisAtivos: (terminaisAtivos) => set({ terminaisAtivos }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setGlobalError: (globalError) => set({ globalError }),

    // Paste
    setPasteRows: (pasteRows) => set({ pasteRows }),
    setPasteModalAberto: (pasteModalAberto) => set({ pasteModalAberto }),
    clearPasteRows: () => set({ pasteRows: [], pasteModalAberto: false }),

    // Filtros
    setFiltro: (filtro) =>
      set((state) => ({ filtro: { ...state.filtro, ...filtro } })),

    // Dashboard
    setDashboardStats: (dashboardStats) => set({ dashboardStats }),
    setMovimentacoesPorDia: (movimentacoesPorDia) => set({ movimentacoesPorDia }),

    // Selectors
    getProdutoById: (id) => get().produtos.find((p) => p.id === id),

    getProdutosFiltrados: () => {
      const { produtos, filtro } = get();
      return produtos.filter((p) => {
        const matchBusca =
          !filtro.busca ||
          p.nome.toLowerCase().includes(filtro.busca.toLowerCase()) ||
          p.codigo.toLowerCase().includes(filtro.busca.toLowerCase());
        const matchStatus =
          filtro.status === 'todos' || getEstoqueStatus(p) === filtro.status;
        return matchBusca && matchStatus;
      });
    },

    getEstoqueStatus,
  }))
);
