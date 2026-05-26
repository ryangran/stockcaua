import { supabase } from './supabase';
import type {
  Produto, Movimentacao, MovimentacaoTipo, Compra, Kit, Producao, Retorno,
  DashboardStats, MovimentacaoDia, PasteRow, Usuario,
} from '../types';

// ─── Produtos ─────────────────────────────────────────────
export async function fetchProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data;
}

export async function createProduto(p: Omit<Produto, 'id' | 'created_at' | 'updated_at'>): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .insert(p)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduto(id: string, p: Partial<Omit<Produto, 'id'>>): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .update({ ...p, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduto(id: string): Promise<void> {
  const { error: errMov } = await supabase.from('movimentacoes').delete().eq('produto_id', id);
  if (errMov) throw errMov;
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) throw error;
}

// ─── Movimentações ────────────────────────────────────────
export async function fetchMovimentacoes(limit = 200): Promise<Movimentacao[]> {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('*, produto:produtos(id,codigo,nome,unidade)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Movimentacao[];
}

export async function createMovimentacao(
  m: Omit<Movimentacao, 'id' | 'created_at' | 'produto'>
): Promise<Movimentacao> {
  const { data, error } = await supabase
    .from('movimentacoes')
    .insert(m)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Compras (com cálculo de preço médio) ─────────────────
export async function registrarCompra(params: {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  fornecedor?: string;
  terminal: string;
}): Promise<{ compra: Compra; produto: Produto }> {
  const { produto_id, quantidade, preco_unitario, fornecedor, terminal } = params;

  // 1. Buscar produto atual
  const { data: prod, error: prodErr } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', produto_id)
    .single();
  if (prodErr) throw prodErr;

  // 2. Calcular preço médio ponderado
  const estoqueAtual = prod.estoque_atual;
  const precoMedioAtual = prod.preco_medio;
  const novoEstoque = estoqueAtual + quantidade;
  const novoPrecoMedio =
    novoEstoque > 0
      ? (estoqueAtual * precoMedioAtual + quantidade * preco_unitario) / novoEstoque
      : preco_unitario;

  // 3. Atualizar produto
  const { data: prodAtualizado, error: updateErr } = await supabase
    .from('produtos')
    .update({
      estoque_atual: novoEstoque,
      preco_medio: novoPrecoMedio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', produto_id)
    .select()
    .single();
  if (updateErr) throw updateErr;

  // 4. Registrar compra
  const { data: compra, error: compraErr } = await supabase
    .from('compras')
    .insert({ produto_id, quantidade, preco_unitario, preco_total: quantidade * preco_unitario, fornecedor })
    .select()
    .single();
  if (compraErr) throw compraErr;

  // 5. Registrar movimentação
  await supabase.from('movimentacoes').insert({
    produto_id, tipo: 'entrada', quantidade, preco_unitario, motivo: 'Compra', terminal,
  });

  return { compra, produto: prodAtualizado };
}

export async function fetchCompras(limit = 100): Promise<Compra[]> {
  const { data, error } = await supabase
    .from('compras')
    .select('*, produto:produtos(id,codigo,nome,unidade)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Compra[];
}

// ─── Kits ─────────────────────────────────────────────────
export async function fetchKits(): Promise<Kit[]> {
  const { data, error } = await supabase
    .from('kits')
    .select('*, itens:kit_itens(*, produto:produtos(*))')
    .order('nome');
  if (error) throw error;
  return data as unknown as Kit[];
}

export async function createKit(kit: { nome: string; descricao?: string }, itens: { produto_id: string; quantidade: number }[]): Promise<Kit> {
  const { data: novoKit, error } = await supabase
    .from('kits')
    .insert(kit)
    .select()
    .single();
  if (error) throw error;

  if (itens.length > 0) {
    const { error: itensErr } = await supabase
      .from('kit_itens')
      .insert(itens.map((i) => ({ ...i, kit_id: novoKit.id })));
    if (itensErr) throw itensErr;
  }

  return fetchKitById(novoKit.id);
}

export async function fetchKitById(id: string): Promise<Kit> {
  const { data, error } = await supabase
    .from('kits')
    .select('*, itens:kit_itens(*, produto:produtos(*))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as Kit;
}

export async function deleteKit(id: string): Promise<void> {
  const { error } = await supabase.from('kits').delete().eq('id', id);
  if (error) throw error;
}

// ─── Produções (baixa em lote) ────────────────────────────
export type ValidacaoProducao = { valido: boolean; erros: string[] };

export function validarProducao(kit: Kit, quantidade: number): ValidacaoProducao {
  const erros: string[] = [];
  for (const item of kit.itens ?? []) {
    const necessario = item.quantidade * quantidade;
    const disponivel = item.produto?.estoque_atual ?? 0;
    if (disponivel < necessario) {
      erros.push(
        `${item.produto?.nome}: precisa ${necessario} ${item.produto?.unidade}, tem ${disponivel}`
      );
    }
  }
  return { valido: erros.length === 0, erros };
}

export async function registrarProducao(params: {
  kit: Kit;
  quantidade: number;
  terminal: string;
}): Promise<Producao> {
  const { kit, quantidade, terminal } = params;
  const validacao = validarProducao(kit, quantidade);
  if (!validacao.valido) throw new Error(validacao.erros.join('\n'));

  // Baixa em lote de cada componente
  for (const item of kit.itens ?? []) {
    const qtdBaixar = item.quantidade * quantidade;
    const prod = item.produto!;

    await supabase
      .from('produtos')
      .update({ estoque_atual: prod.estoque_atual - qtdBaixar, updated_at: new Date().toISOString() })
      .eq('id', prod.id);

    await supabase.from('movimentacoes').insert({
      produto_id: prod.id,
      tipo: 'saida',
      quantidade: qtdBaixar,
      motivo: `Produção: ${kit.nome} (x${quantidade})`,
      terminal,
    });
  }

  const { data, error } = await supabase
    .from('producoes')
    .insert({ kit_id: kit.id, quantidade, terminal })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProducoes(limit = 100): Promise<Producao[]> {
  const { data, error } = await supabase
    .from('producoes')
    .select('*, kit:kits(id,nome)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Producao[];
}

// ─── Retornos ─────────────────────────────────────────────
export async function registrarRetorno(params: {
  produto_id: string;
  quantidade_saiu: number;
  quantidade_voltou: number;
  quantidade_descartada: number;
  motivo_descarte?: string;
  evento?: string;
  terminal: string;
}): Promise<Retorno> {
  const { produto_id, quantidade_voltou, terminal, ...rest } = params;

  // Ajusta estoque com o que voltou
  const { data: prod } = await supabase
    .from('produtos')
    .select('estoque_atual')
    .eq('id', produto_id)
    .single();

  await supabase
    .from('produtos')
    .update({ estoque_atual: (prod?.estoque_atual ?? 0) + quantidade_voltou, updated_at: new Date().toISOString() })
    .eq('id', produto_id);

  await supabase.from('movimentacoes').insert({
    produto_id,
    tipo: 'retorno',
    quantidade: quantidade_voltou,
    motivo: rest.evento ? `Retorno de evento: ${rest.evento}` : 'Retorno',
    terminal,
  });

  const { data, error } = await supabase
    .from('retornos')
    .insert({ produto_id, quantidade_voltou, ...rest })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchRetornos(limit = 100): Promise<Retorno[]> {
  const { data, error } = await supabase
    .from('retornos')
    .select('*, produto:produtos(id,codigo,nome,unidade)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Retorno[];
}

// ─── Movimentação direta ──────────────────────────────────
export async function registrarMovimentacao(params: {
  produto_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  motivo?: string;
  terminal: string;
}): Promise<void> {
  const { produto_id, tipo, quantidade, terminal, motivo } = params;
  const { data: prod } = await supabase
    .from('produtos')
    .select('estoque_atual')
    .eq('id', produto_id)
    .single();

  const delta = tipo === 'saida' ? -quantidade : quantidade;
  await supabase
    .from('produtos')
    .update({ estoque_atual: (prod?.estoque_atual ?? 0) + delta, updated_at: new Date().toISOString() })
    .eq('id', produto_id);

  await supabase.from('movimentacoes').insert({ produto_id, tipo, quantidade, motivo, terminal });
}

// ─── Dashboard Stats ──────────────────────────────────────
export async function fetchDashboardStats(produtos: Produto[]): Promise<DashboardStats> {
  const total_skus = produtos.length;
  const valor_total_estoque = produtos.reduce(
    (sum, p) => sum + p.estoque_atual * p.preco_medio, 0
  );
  const itens_criticos = produtos.filter(
    (p) => p.estoque_atual <= p.estoque_minimo * 0.5 && p.estoque_minimo > 0
  ).length;

  const { data: movs } = await supabase
    .from('movimentacoes')
    .select('quantidade, tipo, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .eq('tipo', 'saida');

  const totalSaidas = (movs ?? []).reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const giro_medio = total_skus > 0 ? totalSaidas / total_skus : 0;

  return { total_skus, valor_total_estoque, itens_criticos, giro_medio };
}

export async function fetchMovimentacoesPorDia(): Promise<MovimentacaoDia[]> {
  const desde = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('tipo, quantidade, created_at')
    .gte('created_at', desde)
    .order('created_at');
  if (error) throw error;

  const mapa: Record<string, { entradas: number; saidas: number }> = {};
  for (const m of data ?? []) {
    const dia = m.created_at.slice(0, 10);
    if (!mapa[dia]) mapa[dia] = { entradas: 0, saidas: 0 };
    if (m.tipo === 'entrada') mapa[dia].entradas += m.quantidade;
    else if (m.tipo === 'saida') mapa[dia].saidas += m.quantidade;
  }

  return Object.entries(mapa).map(([data, v]) => ({ data, ...v }));
}

// ─── Usuários ─────────────────────────────────────────────
export async function solicitarAcesso(nome: string, senha: string): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .insert({ nome: nome.trim(), senha, role: 'user', status: 'pendente' });
  if (error) throw error;
}

export async function fetchUsuariosPendentes(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Usuario[];
}

export async function aprovarUsuario(id: string): Promise<void> {
  const { error } = await supabase.from('usuarios').update({ status: 'aprovado' }).eq('id', id);
  if (error) throw error;
}

export async function rejeitarUsuario(id: string): Promise<void> {
  const { error } = await supabase.from('usuarios').update({ status: 'rejeitado' }).eq('id', id);
  if (error) throw error;
}

// ─── Paste Inteligente ────────────────────────────────────
function parseCurrency(val: string): number {
  const s = val.replace(/[^\d,.]/g, '');
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    // Formato BR: "1.306,40" → remove pontos, troca vírgula
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  } else if (lastDot > lastComma) {
    // Formato EN: "1,306.40" → remove vírgulas
    return parseFloat(s.replace(/,/g, ''));
  }
  return parseFloat(s);
}

function matchProduto(nome: string, produtos: Produto[]): Produto | undefined {
  const q = nome.toLowerCase().trim();
  if (!q) return undefined;
  return (
    produtos.find((p) => p.codigo.toLowerCase() === q) ??
    produtos.find((p) => p.nome.toLowerCase() === q) ??
    produtos.find((p) => p.nome.toLowerCase().includes(q) || q.includes(p.nome.toLowerCase()))
  );
}

// Recebe linhas já parseadas (string[][]) — usada tanto pelo upload de planilha quanto pelo paste
export async function parsearLinhasImport(linhas: string[][], produtos: Produto[]): Promise<PasteRow[]> {
  if (!linhas.length) return [];

  // Formato B: Setor(0) | Produto(1) | Especificação(2) | Quantidade(3) | Unidade(4) | Valor Total(5)
  // Detecta procurando qualquer linha onde col[3] seja número (ignora cabeçalho com texto)
  const isFormatoB = linhas.some(
    (row) => row.length >= 4 && !isNaN(parseFloat(String(row[3]).replace(',', '.')))
  );

  const rows: PasteRow[] = [];

  for (const cols of linhas) {
    const cel = (i: number) => String(cols[i] ?? '').trim();

    if (isFormatoB) {
      // Pula cabeçalho e linhas vazias (col[3] não é número)
      const qtdRaw = parseFloat(cel(3).replace(',', '.'));
      if (isNaN(qtdRaw) || qtdRaw <= 0) continue;

      const nomeProduto = cel(1);
      if (!nomeProduto) continue;

      const valorTotal = parseCurrency(cel(5));
      const preco_unitario = !isNaN(valorTotal) && qtdRaw > 0 ? valorTotal / qtdRaw : undefined;

      const produto = matchProduto(nomeProduto, produtos);
      rows.push({
        codigo: nomeProduto,
        quantidade: qtdRaw,
        preco_unitario,
        valido: !!produto,
        produto,
        erro: !produto ? 'Não encontrado' : undefined,
        setor: cel(0),
        especificacao: cel(2),
        unidade_planilha: cel(4),
        valor_total: !isNaN(valorTotal) ? valorTotal : undefined,
      });
    } else {
      // Formato legado: Código | Quantidade | Preço
      const codigoOuNome = cel(0);
      if (!codigoOuNome) continue;
      const qtd = parseFloat(cel(1).replace(',', '.'));
      const preco = parseFloat(cel(2).replace(',', '.'));
      const quantidade = isNaN(qtd) ? 0 : qtd;
      const produto = matchProduto(codigoOuNome, produtos);
      rows.push({
        codigo: codigoOuNome,
        quantidade,
        preco_unitario: !isNaN(preco) ? preco : undefined,
        valido: !!produto && quantidade > 0,
        produto,
        erro: !produto ? 'Não encontrado' : quantidade <= 0 ? 'Qtd inválida' : undefined,
      });
    }
  }

  return rows;
}

export async function parsearPaste(text: string, produtos: Produto[]): Promise<PasteRow[]> {
  const linhas = text.trim().split('\n').filter(Boolean).map((linha) =>
    linha.split(/\t|;|,/).map((c) => c.trim().replace(/^"|"$/g, ''))
  );
  return parsearLinhasImport(linhas, produtos);
}

// ─── Exportar CSV de Necessidades ─────────────────────────
export function exportarNecessidadesCSV(produtos: Produto[]): void {
  const linhas = [
    ['Código', 'Nome', 'Estoque Atual', 'Estoque Mínimo', 'Déficit', 'Unidade'],
    ...produtos
      .filter((p) => p.estoque_atual < p.estoque_minimo)
      .sort((a, b) => (a.estoque_atual - a.estoque_minimo) - (b.estoque_atual - b.estoque_minimo))
      .map((p) => [
        p.codigo,
        p.nome,
        String(p.estoque_atual),
        String(p.estoque_minimo),
        String(p.estoque_minimo - p.estoque_atual),
        p.unidade,
      ]),
  ];

  const csv = linhas.map((l) => l.join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `necessidades_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
