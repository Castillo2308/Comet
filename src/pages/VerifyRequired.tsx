import { useEffect, useState } from 'react';

export default function VerifyRequired() {
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const pending = localStorage.getItem('pendingVerifyEmail') || '';
    setEmail(pending);
  }, []);

  const checkNow = async () => {
    setChecking(true);
    setTimeout(() => {
      window.location.href = '/signin';
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">Verifica tu cuenta</h1>
        <p className="text-gray-600">Te enviamos un correo de verificación {email ? `a ${email}` : ''}. Revisa tu bandeja y spam.</p>
        <div className="flex items-center justify-center gap-3">
          <button disabled={checking} onClick={checkNow} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
            {checking ? 'Comprobando...' : 'Ya verifiqué, continuar'}
          </button>
          <button
            disabled={sending}
            onClick={async () => {
              setError(null);
              setSending(true);
              try {
                await fetch('/api/users/resend-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                });
                setSent(true);
              } catch (e) {
                setError('No se pudo reenviar. Intenta de nuevo más tarde.');
              } finally {
                setSending(false);
              }
            }}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            {sending ? 'Reenviando…' : 'Reenviar correo'}
          </button>
        </div>
        {sent && <div className="text-green-600 text-sm">Correo de verificación reenviado.</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
}
