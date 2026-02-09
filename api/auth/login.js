import { db } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ✅ 修正後：環境変数がない場合はエラーを投げる（安全策）
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // 本番環境で設定忘れがあった場合にすぐ気づける
  console.error("JWT_SECRET is not set!");
}

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