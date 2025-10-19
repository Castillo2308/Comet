import { createUser, getUserByEmail, updateUser, deleteUser, getUserByCedula, listUsers, deleteUserCascade, insertVerifyToken, consumeVerifyToken, setUserVerifiedByEmail } from '../models/usersModel.js';
import bcrypt from 'bcryptjs';    // Same as const bcrypt = require('bcryptjs');
import { signAccessToken } from '../lib/auth.js';
import crypto from 'crypto';
import { sendVerificationEmail } from '../lib/email.js';

const allowedRoles = ['user','admin','security','news','reports','buses','driver','community'];

function validatePassword(password, context = {}) {
  const violations = [];
  if (typeof password !== 'string') return { ok: false, violations: ['La contraseña es inválida.'] };
  const minLen = 12;
  const maxLen = 128;
  if (password.length < minLen) violations.push(`Al menos ${minLen} caracteres.`);
  if (password.length > maxLen) violations.push(`No más de ${maxLen} caracteres.`);
  if (!/[a-z]/.test(password)) violations.push('Debe incluir una letra minúscula.');
  if (!/[A-Z]/.test(password)) violations.push('Debe incluir una letra mayúscula.');
  if (!/\d/.test(password)) violations.push('Debe incluir un número.');
  if (!/[^A-Za-z0-9\s]/.test(password)) violations.push('Debe incluir un carácter especial.');
  if (/\s/.test(password)) violations.push('No debe contener espacios.');
  // Repeticiones (3+ iguales seguidas)
  if (/(.)\1\1/.test(password)) violations.push('No use 3 o más caracteres repetidos seguidos.');
  // Secuencias numéricas 4+
  const hasSeq = (() => {
    const digits = password.replace(/\D+/g, '');
    for (let i = 0; i <= digits.length - 4; i++) {
      const chunk = digits.slice(i, i + 4);
      const asc = '0123456789';
      const desc = '9876543210';
      if (asc.includes(chunk) || desc.includes(chunk)) return true;
    }
    return false;
  })();
  if (hasSeq) violations.push('Evite secuencias numéricas como 1234 o 4321.');
  // Denylist básica
  const deny = ['password','123456','12345678','qwerty','111111','123123','iloveyou','abc123','password1'];
  if (deny.includes(password.toLowerCase())) violations.push('La contraseña es demasiado común.');
  // Personal info
  const { name, lastname, email, cedula } = context || {};
  const tests = [];
  if (name) tests.push(String(name));
  if (lastname) tests.push(String(lastname));
  if (cedula) tests.push(String(cedula));
  if (email) tests.push(String(email).split('@')[0]);
  const lowerPw = password.toLowerCase();
  for (const t of tests) {
    const s = String(t).trim().toLowerCase();
    if (s && s.length >= 3 && lowerPw.includes(s)) {
      violations.push('No incluya su nombre/apellido/cédula/correo en la contraseña.');
      break;
    }
  }
  return { ok: violations.length === 0, violations };
}

const registerUser = async (req, res) => {
  // Extract all five fields from the request body.
  const { name, lastname, cedula, email, password, role } = req.body;

  // Log for debugging
  console.log('[register] Request received:', { 
    hasName: !!name, 
    hasLastname: !!lastname, 
    hasCedula: !!cedula, 
    hasEmail: !!email, 
    hasPassword: !!password,
    bodyKeys: Object.keys(req.body || {})
  });

  // Basic validation.
  if (!name || !lastname || !cedula || !email || !password) {
    const missing = [];
    if (!name) missing.push('name');
    if (!lastname) missing.push('lastname');
    if (!cedula) missing.push('cedula');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    console.log('[register] Missing fields:', missing);
    return res.status(400).json({ message: 'All fields are required.', missing });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(String(email))) {
    console.log('[register] Invalid email:', email);
    return res.status(400).json({ message: 'Email inválido.' });
  }

  try {
    // Validate password strength
    const check = validatePassword(password, { name, lastname, email, cedula });
    if (!check.ok) {
      console.log('[register] Password validation failed:', check.violations);
      return res.status(400).json({ message: 'La contraseña no cumple los requisitos.', violations: check.violations });
    }
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Call the model to create a new user with the hashed password
  const safeRole = allowedRoles.includes(role) ? role : 'user';
  const isAdmin = safeRole !== 'user';
  const verified = isAdmin ? true : false;
  const { success, duplicate } = await createUser({ name, lastname, cedula, email, password: hashedPassword, role: safeRole, verified });
    if (duplicate) {
      const msg = duplicate === 'cedula' ? 'Esta cédula ya está registrada.' : 'Este email ya está registrado.';
      return res.status(409).json({ message: msg, duplicate });
    }
    if (success) {
      if (!isAdmin) {
        // Generate verification token and send email
        const token = crypto.randomBytes(24).toString('hex');
        const baseUrl = process.env.PUBLIC_BASE_URL || (req.headers.origin || `${req.protocol}://${req.get('host')}`);
  const verifyUrl = `${baseUrl}/verified?token=${encodeURIComponent(token)}`;
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(); // 48h
        try { await insertVerifyToken({ token, email, expiresAt }); } catch (e) { console.log('[register] Token insert failed:', e); }
        try { await sendVerificationEmail({ to: email, verifyUrl }); } catch (e) { console.log('[register] Email send failed:', e); }
      }
      console.log('[register] User registered successfully:', email);
      res.status(201).json({ message: 'User registered successfully!', verified });
    } else {
      console.log('[register] User creation failed');
      res.status(500).json({ message: 'Failed to register user.' });
    }
  } catch (error) {
    console.error('[register] Unexpected error:', error);
    res.status(500).json({ message: 'Failed to register user.' });
  }
};

const loginUser = async (req, res) => {
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(String(email))) {
    return res.status(400).json({ message: 'Email inválido.' });
  }

  try {
    // Here you would typically fetch the user from the database
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // If not verified, return a flag so frontend can block until verification
    if (!user.verified) {
      return res.status(200).json({ message: 'Cuenta no verificada', user: { ...user, password: undefined }, requiresVerification: true });
    }

    // If login is successful, issue JWT and return user data (excluding password)
    const { password: _, ...userData } = user;
    const token = signAccessToken({ cedula: user.cedula, email: user.email, role: user.role });
    res.status(200).json({ message: 'Login successful!', user: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login.' });
  }
};

const updateUserInfo = async (req, res) => {
  const { cedula } = req.params;
  // Allow updating role as well (for admin panel). Password, if provided, will be hashed.
  const { name, lastname, email, password, role } = req.body;
  try {
    let hashed = undefined;
    if (password) {
      const check = validatePassword(password, { name, lastname, email, cedula });
      if (!check.ok) {
        return res.status(400).json({ message: 'La contraseña no cumple los requisitos.', violations: check.violations });
      }
      const salt = await bcrypt.genSalt(10);
      hashed = await bcrypt.hash(password, salt);
    }
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido.' });
    }
    const updated = await updateUser(cedula, { name, lastname, email, password: hashed, role });
    if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User updated', user: updated });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Failed to update user.' });
  }
};

const deleteUserAccount = async (req, res) => {
  const { cedula } = req.params;
  try {
    if (String(cedula) === '000000000') return res.status(403).json({ message: 'No se puede eliminar el administrador global.' });
    const exists = await getUserByCedula(cedula);
    if (!exists) return res.status(404).json({ message: 'User not found' });
  const ok = await deleteUserCascade(cedula);
    if (ok) return res.json({ message: 'User deleted' });
    res.status(500).json({ message: 'Failed to delete user.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

export default { registerUser, loginUser, updateUserInfo, deleteUserAccount };    // Same as module.exports = { registerUser };
export const listAllUsers = async (_req, res) => {
  try { res.json(await listUsers()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list users' }); }
};

export const verifyAccount = async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ message: 'Token requerido' });
  try {
    const email = await consumeVerifyToken(token);
    if (!email) return res.status(400).json({ message: 'Token inválido o expirado' });
    await setUserVerifiedByEmail(email);
    return res.json({ message: 'Cuenta verificada' });
  } catch (e) {
    console.error('verifyAccount error', e);
    res.status(500).json({ message: 'Error verificando cuenta' });
  }
};

export const me = async (req, res) => {
  // Optionally allow frontend to poll verification status
  try {
    const u = await getUserByCedula(req.user?.cedula);
    if (!u) return res.status(404).json({ message: 'Not found' });
    const { password: _, ...safe } = u;
    res.json(safe);
  } catch {
    res.status(500).json({ message: 'Failed' });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return res.status(400).json({ message: 'Email requerido' });

    const user = await getUserByEmail(normalized);
    // Do not reveal if user exists or not; always return 200
    if (!user) return res.json({ ok: true });
    if (user.verified) return res.json({ ok: true });

    const token = crypto.randomBytes(24).toString('hex');
    const baseUrl = process.env.PUBLIC_BASE_URL || (req.headers.origin || `${req.protocol}://${req.get('host')}`);
  const verifyUrl = `${baseUrl}/verified?token=${encodeURIComponent(token)}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(); // 48h
    try { await insertVerifyToken({ token, email: normalized, expiresAt }); } catch {}
    try { await sendVerificationEmail({ to: normalized, verifyUrl }); } catch {}
    return res.json({ ok: true });
  } catch (e) {
    console.error('resendVerification error', e);
    return res.json({ ok: true });
  }
};

