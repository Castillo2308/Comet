import { createUser, getUserByEmail, updateUser, deleteUser, getUserByCedula, listUsers, deleteUserCascade } from '../models/usersModel.js';
import bcrypt from 'bcryptjs';    // Same as const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  // Extract all five fields from the request body.
  const { name, lastname, cedula, email, password } = req.body;

  // Basic validation.
  if (!name || !lastname || !cedula || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Call the model to create a new user with the hashed password
    const { success, user } = await createUser({ name, lastname, cedula, email, password: hashedPassword });
    if (success) {
      res.status(201).json({ message: 'User registered successfully!' });
    } else {
      res.status(500).json({ message: 'Failed to register user.' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user.' });
  }
};

const loginUser = async (req, res) => {
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
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

    // If login is successful, return the user data (excluding password)
    const { password: _, ...userData } = user;
    // Provide a default role until RBAC is implemented
    res.status(200).json({ message: 'Login successful!', user: { ...userData, role: 'user' } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login.' });
  }
};

const updateUserInfo = async (req, res) => {
  const { cedula } = req.params;
  const { name, lastname, email, password } = req.body;
  try {
    let hashed = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashed = await bcrypt.hash(password, salt);
    }
    const updated = await updateUser(cedula, { name, lastname, email, password: hashed });
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

