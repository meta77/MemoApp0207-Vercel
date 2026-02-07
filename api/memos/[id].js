import { db } from '../../db.js'; // 階層注意
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-me';

export default async function handler(req, res) {
  const { id } = req.query; // URLの[id]部分
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // PUT: 編集
  if (req.method === 'PUT') {
    const { title, content } = req.body;
    await db.sql`
      UPDATE memos
      SET title = ${title}, content = ${content}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `;
    return res.json({ message: 'Updated' });
  }

  // DELETE: 論理削除
  if (req.method === 'DELETE') {
    await db.sql`
      UPDATE memos
      SET deleted_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `;
    return res.json({ message: 'Deleted' });
  }
}