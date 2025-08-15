import { createUser, getUserByEmail } from '../models/usersModel.js';
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
    res.status(200).json({ message: 'Login successful!', user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login.' });
  }
};

export default { registerUser, loginUser };    // Same as module.exports = { registerUser };
