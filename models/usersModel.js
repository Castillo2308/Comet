import { neonClient } from '../lib/neonClient.js';

export const createUser = async ({ name, lastname, cedula, email, password }) => {
  // Insert the new user
  const insertQuery = `
    INSERT INTO users (name, lastname, cedula, email, password)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const insertValues = [name, lastname, cedula, email, password];
  
  const insertResult = await neonClient.query(insertQuery, insertValues);
  

  // Select the newly created user
  const selectQuery = `
    SELECT name, lastname, cedula, email
    FROM users
    WHERE cedula = $1;
  `;
  const selectResult = await neonClient.query(selectQuery, [cedula]);
  
  if (selectResult) {
    return {
      success: true,
    };
  } else {
    throw new Error('User creation failed: No rows returned');
  }
};

export const getUserByEmail = async (email) => {
  const query = `
    SELECT name, lastname, cedula, email, password
    FROM users
    WHERE email = $1;
  `;
  const values = [email.trim()];
  const result = await neonClient.query(query, values);
  if (result) {
    return result[0];
  }
  return null;
};


