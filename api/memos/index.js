import { db } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-me'; // 'secret-key-change-me'をそのまま公開しているから危険。

export default async function handler(req, res) {
  // 認証チェック
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // GET: 一覧取得
  if (req.method === 'GET') {
    const { rows } = await db.sql`
      SELECT id, title, content, created_at
      FROM memos
      WHERE user_id = ${userId} AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    return res.json(rows);
  }

  // POST: 新規作成
  if (req.method === 'POST') {
    const { title, content } = req.body;
    await db.sql`
      INSERT INTO memos (user_id, title, content)
      VALUES (${userId}, ${title}, ${content})
    `;
    return res.status(201).json({ message: 'Memo created' });
  }
}