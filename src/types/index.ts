export type MovimentacaoTipo = 'entrada' | 'saida' | 'retorno' | 'ajuste';

export type EstoqueStatus = 'ok' | 'baixo' | 'critico';

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  preco_medio: number;
  created_at: string;
  updated_at: string;
}

export interface Movimentacao {
  id: string;
  produto_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  preco_unitario: number | null;
  motivo: string | null;
  terminal: string | null;
  created_at: string;
  produto?: Produto;
}

export interface Compra {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  fornecedor: string | null;
  created_at: string;
  produto?: Produto;
}

export interface Kit {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  itens?: KitItem[];
}

export interface KitItem {
  id: string;
  kit_id: string;
  produto_id: string;
  quantidade: number;
  produto?: Produto;
}

export interface Producao {
  id: string;
  kit_id: string;
  quantidade: number;
  terminal: string | null;
  created_at: string;
  kit?: Kit;
}

export interface Retorno {
  id: string;
  produto_id: string;
  quantidade_saiu: number;
  quantidade_voltou: number;
  quantidade_descartada: number;
  motivo_descarte: string | null;
  evento: string | null;
  created_at: string;
  produto?: Produto;
}

export interface ProdutoNecessidade {
  produto: Produto;
  deficit: number;
  prioridade: 'alta' | 'media' | 'baixa';
  dias_restantes: number | null;
}

export interface DashboardStats {
  total_skus: number;
  valor_total_estoque: number;
  itens_criticos: number;
  giro_medio: number;
}

export interface MovimentacaoDia {
  data: string;
  entradas: number;
  saidas: number;
}

export interface Terminal {
  id: string;
  nome: string;
  online_at: string;
}

export interface PasteRow {
  codigo: string;
  nome?: string;
  quantidade: number;
  preco_unitario?: number;
  valido: boolean;
  produto?: Produto;
  erro?: string;
}

export type Tema = 'dark' | 'neon';
