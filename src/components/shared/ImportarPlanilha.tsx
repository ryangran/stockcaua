import { useRef } from 'react';
import { read, utils } from 'xlsx';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { useStockStore } from '../../store/useStockStore';
import { parsearLinhasImport } from '../../lib/api';

export function ImportarPlanilha() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { produtos, setPasteRows, setPasteModalAberto } = useStockStore();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // raw: false converte números/datas corretamente
      const dados: string[][] = utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

      if (!dados.length) { toast.error('Planilha vazia'); return; }

      const rows = await parsearLinhasImport(dados, produtos);
      if (!rows.length) { toast.error('Nenhuma linha encontrada'); return; }

      setPasteRows(rows);
      setPasteModalAberto(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ler arquivo');
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.ods"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
        style={{ border: '1px solid var(--vs-border)', color: 'var(--vs-muted)' }}
        title="Importar planilha (.xlsx, .csv)"
      >
        <Upload size={13} style={{ color: 'var(--vs-orange)' }} />
        Importar planilha
      </button>
    </>
  );
}
