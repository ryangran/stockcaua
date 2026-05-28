import { useState, useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { solicitarAcesso } from '../../lib/api';
import { toast } from 'sonner';

export function RegistroScreen({ onVoltar }: { onVoltar: () => void }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmar) { toast.error('As senhas não coincidem'); return; }
    if (senha.length < 4) { toast.error('Senha deve ter ao menos 4 caracteres'); return; }
    setLoading(true);
    try {
      await solicitarAcesso(nome, senha);
      setEnviado(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? String(err);
      if (msg.includes('unique') || msg.includes('duplicate')) {
        toast.error('Esse nome de usuário já existe');
      } else {
        toast.error(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: '#000', zIndex: 9999 }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />

      <div ref={cardRef} style={{ opacity: 0, width: '100%', maxWidth: 420, padding: '0 16px' }}>
        <div className="mb-8 text-center">
          <p className="text-xs font-mono tracking-[0.3em] mb-1" style={{ color: 'var(--vs-muted)' }}>VISUAL DESIGN</p>
          <h1 className="text-4xl font-black tracking-widest neon-text" style={{ color: 'var(--vs-orange)', letterSpacing: '0.15em' }}>STOCK OS</h1>
          <div className="mt-2 h-px mx-auto w-24" style={{ background: 'var(--vs-orange)', opacity: 0.4 }} />
        </div>

        <div className="rounded-xl p-8" style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', boxShadow: '0 0 40px rgba(249,115,22,0.06)' }}>
          {enviado ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✓</div>
              <p className="text-sm font-medium" style={{ color: 'var(--vs-orange)' }}>Solicitação enviada!</p>
              <p className="text-xs" style={{ color: 'var(--vs-muted)' }}>
                Aguarde o administrador aprovar seu acesso. Assim que for aprovado, você já pode entrar.
              </p>
              <button onClick={onVoltar} className="mt-2 text-xs underline" style={{ color: 'var(--vs-muted)' }}>
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-xs font-mono text-center mb-2" style={{ color: 'var(--vs-muted)' }}>
                Solicitar acesso ao sistema
              </p>

              {[
                { label: 'Nome de usuário', value: nome, set: setNome, type: 'text', placeholder: 'seu nome' },
                { label: 'Senha', value: senha, set: setSenha, type: 'password', placeholder: '••••••' },
                { label: 'Confirmar senha', value: confirmar, set: setConfirmar, type: 'password', placeholder: '••••••' },
              ].map(({ label, value, set, type, placeholder }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--vs-muted)' }}>{label}</label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    required
                    className="rounded-md px-3 py-2.5 text-sm font-mono outline-none transition-all"
                    style={{ background: '#0a0a0a', border: '1px solid var(--vs-border)', color: '#fff' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--vs-orange)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--vs-border)')}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-md py-2.5 text-sm font-bold tracking-widest uppercase transition-all"
                style={{ background: loading ? 'rgba(249,115,22,0.4)' : 'var(--vs-orange)', color: '#000', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.15em' }}
              >
                {loading ? 'Enviando...' : 'Solicitar Acesso'}
              </button>

              <button type="button" onClick={onVoltar} className="text-xs text-center" style={{ color: 'var(--vs-muted)' }}>
                ← Voltar para o login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
