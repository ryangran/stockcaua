import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AlterarCredenciaisModal({ open, onClose }: Props) {
  const { usuarioLogado, alterarCredenciais } = useAuthStore();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novoUsuario, setNovoUsuario] = useState(usuarioLogado);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');

  function resetForm() {
    setSenhaAtual('');
    setNovoUsuario(usuarioLogado);
    setNovaSenha('');
    setConfirmar('');
    setErro('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (!novoUsuario.trim()) { setErro('Usuário não pode ser vazio.'); return; }
    if (novaSenha.length < 4) { setErro('Senha precisa ter pelo menos 4 caracteres.'); return; }
    if (novaSenha !== confirmar) { setErro('Senhas não conferem.'); return; }

    const ok = alterarCredenciais(senhaAtual, novoUsuario.trim(), novaSenha);
    if (!ok) {
      setErro('Senha atual incorreta.');
      return;
    }

    toast.success('Credenciais atualizadas com sucesso.');
    handleClose();
  }

  const inputStyle: React.CSSProperties = {
    background: '#0a0a0a',
    border: '1px solid var(--vs-border)',
    color: '#fff',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'monospace',
    width: '100%',
    outline: 'none',
  };

  function focusOrange(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--vs-orange)';
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--vs-border)';
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-sm"
        style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--vs-orange)', fontSize: 14, letterSpacing: '0.05em' }}>
            Alterar Credenciais
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--vs-muted)' }}>Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => { setSenhaAtual(e.target.value); setErro(''); }}
              placeholder="••••••"
              style={inputStyle}
              onFocus={focusOrange}
              onBlur={blurBorder}
              required
            />
          </div>

          <div className="h-px" style={{ background: 'var(--vs-border)' }} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--vs-muted)' }}>Novo usuário</label>
            <input
              type="text"
              value={novoUsuario}
              onChange={(e) => { setNovoUsuario(e.target.value); setErro(''); }}
              style={inputStyle}
              onFocus={focusOrange}
              onBlur={blurBorder}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--vs-muted)' }}>Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => { setNovaSenha(e.target.value); setErro(''); }}
              placeholder="mínimo 4 caracteres"
              style={inputStyle}
              onFocus={focusOrange}
              onBlur={blurBorder}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--vs-muted)' }}>Confirmar nova senha</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => { setConfirmar(e.target.value); setErro(''); }}
              placeholder="repita a nova senha"
              style={inputStyle}
              onFocus={focusOrange}
              onBlur={blurBorder}
              required
            />
          </div>

          {erro && (
            <p
              className="text-xs text-center py-1.5 rounded font-mono"
              style={{ color: 'var(--vs-red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              ✕ {erro}
            </p>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-md py-2 text-sm"
              style={{ border: '1px solid var(--vs-border)', color: 'var(--vs-muted)', background: 'transparent' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md py-2 text-sm font-bold"
              style={{ background: 'var(--vs-orange)', color: '#000' }}
            >
              Salvar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
