import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const q = useQuery();
  const token = q.get('token') || '';
  const [valid, setValid] = useState<boolean | null>(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwTouched, setPwTouched] = useState(false);
  const [pwViolations, setPwViolations] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`/api/users/recover/verify?token=${encodeURIComponent(token)}`);
        const j = await r.json();
        if (!ignore) setValid(!!j.ok);
      } catch {
        if (!ignore) setValid(false);
      }
    })();
    return () => { ignore = true; };
  }, [token]);

  // Mirror Register.tsx password policy (min 12)
  const validatePassword = (password: string) => {
    const v: string[] = [];
    const minLen = 12;
    if (password.length < minLen) v.push(`Al menos ${minLen} caracteres.`);
    if (password.length > 128) v.push('No más de 128 caracteres.');
    if (!/[a-z]/.test(password)) v.push('Incluye una letra minúscula.');
    if (!/[A-Z]/.test(password)) v.push('Incluye una letra mayúscula.');
    if (!/\d/.test(password)) v.push('Incluye un número.');
    if (!/[^A-Za-z0-9\s]/.test(password)) v.push('Incluye un carácter especial.');
    if (/\s/.test(password)) v.push('No debe tener espacios.');
    if (/(.)\1\1/.test(password)) v.push('Evita 3+ caracteres repetidos.');
    const digits = password.replace(/\D+/g, '');
    for (let i = 0; i <= digits.length - 4; i++) {
      const chunk = digits.slice(i, i + 4);
      if ('0123456789'.includes(chunk) || '9876543210'.includes(chunk)) { v.push('Evita secuencias como 1234 o 4321.'); break; }
    }
    return v;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pw || pw !== pw2) { setError('Las contraseñas no coinciden'); return; }
    const v = validatePassword(pw);
    if (v.length > 0) { setPwViolations(v); setPwTouched(true); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/users/recover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw })
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setOk(true);
        setTimeout(() => navigate('/signin'), 1500);
      } else {
        setError(j.message || 'No se pudo restablecer la contraseña');
      }
    } catch {
      setError('No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) return <div className="p-6 text-center">Verificando enlace…</div>;
  if (!valid) return <div className="p-6 text-center">Enlace inválido o expirado.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Restablecer contraseña</h2>
          <p className="text-gray-600">Ingresa tu nueva contraseña</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        {ok && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">Contraseña actualizada. Redirigiendo…</div>}
        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            type="password"
            className="w-full border rounded-xl p-3"
            placeholder="Nueva contraseña"
            value={pw}
            onChange={e=>{ setPw(e.target.value); setPwViolations(validatePassword(e.target.value)); }}
            onBlur={()=> setPwTouched(true)}
          />
          {(pwTouched || pw) && (
            <div className="mt-1 text-xs">
              <div className={`h-1 rounded ${pwViolations.length === 0 && pw.length >= 12 ? 'bg-green-500' : pwViolations.length <= 2 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
              <ul className="mt-2 space-y-1 text-gray-600">
                {[
                  'Al menos 12 caracteres.',
                  'Incluye una letra minúscula.',
                  'Incluye una letra mayúscula.',
                  'Incluye un número.',
                  'Incluye un carácter especial.',
                  'No debe tener espacios.',
                  'Evita 3+ caracteres repetidos.',
                  'Evita secuencias como 1234 o 4321.'
                ].map(req => (
                  <li key={req} className={`flex items-center gap-2 ${pwViolations.includes(req) ? 'text-gray-500' : 'text-green-600'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${pwViolations.includes(req) ? 'bg-gray-300' : 'bg-green-500'}`}></span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <input
            type="password"
            className="w-full border rounded-xl p-3"
            placeholder="Confirmar contraseña"
            value={pw2}
            onChange={e=>setPw2(e.target.value)}
          />
          <button disabled={loading || pwViolations.length > 0 || pw.length < 12 || pw !== pw2} className="w-full py-3 rounded-xl bg-blue-600 text-white disabled:opacity-50">{loading?'Guardando…':'Guardar contraseña'}</button>
        </form>
      </div>
    </div>
  );
}
