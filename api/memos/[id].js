import { db } from '../../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-me';

export default async function handler(req, res) {
  // IDの取得（クエリパラメータから安全に取得）
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Memo ID is required' });
  }

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

  try {
    // PUT: 編集
    if (req.method === 'PUT') {
      const { title, content } = req.body;

      // バリデーション
      if (content === undefined) {
         return res.status(400).json({ error: 'Content is required' });
      }

      const result = await db.sql`
        UPDATE memos
        SET title = ${title}, content = ${content}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
      `;

      // 更新対象があったか確認
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Memo not found or not authorized' });
      }

      return res.json({ message: 'Updated' });
    }

    // DELETE: 論理削除
    if (req.method === 'DELETE') {
      const result = await db.sql`
        UPDATE memos
        SET deleted_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Memo not found or not authorized' });
      }

      return res.json({ message: 'Deleted' });
    }

    // その他のメソッド
    return res.status(405).send('Method Not Allowed');

  } catch (error) {
    console.error('API Error:', error); // Vercelログに出力
    return res.status(500).json({ error: error.message });
  }
}