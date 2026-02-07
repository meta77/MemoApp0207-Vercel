import { db } from '../db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // email重複時はエラーになる(UNIQUE制約)
    await db.sql`
      INSERT INTO users (email, password_hash) VALUES (${email}, ${hashedPassword})
    `;
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}