import { db } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-me'; // 本番ではVercelの環境変数に設定推奨

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { email, password } = req.body;

  try {
    const { rows } = await db.sql`SELECT * FROM users WHERE email = ${email}`;
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) { // もし「ユーザーは存在しますが、パスワードが違います」と詳しく教えてしまうと、悪意のある人に「このメールアドレスは登録済みなんだな」というヒントを与えてしまいます（リスト攻撃への対策）。
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}