import { createUser } from '../models/usersModel.js';
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
      res.status(201).json({ message: 'User registered successfully!', user });
    } else {
      res.status(500).json({ message: 'Failed to register user.' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user.' });
  }
};

export default { registerUser };    // Same as module.exports = { registerUser };
