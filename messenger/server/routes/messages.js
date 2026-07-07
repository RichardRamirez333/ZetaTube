const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', auth, (req, res) => {
  const conversations = db.prepare(`
    SELECT c.id, c.created_at,
           (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
           (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender_id
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = ?
    ORDER BY last_message_time DESC
  `).all(req.user.id);

  const result = conversations.map(c => {
    const participants = db.prepare(`
      SELECT u.id, u.username, u.avatar
      FROM users u
      JOIN conversation_participants cp ON u.id = cp.user_id
      WHERE cp.conversation_id = ?
    `).all(c.id);
    return { ...c, participants };
  });

  res.json({ conversations: result });
});

router.get('/conversations/:id/messages', auth, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.username, u.avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC
  `).all(req.params.id);

  const result = messages.map(m => {
    let replyToMsg = null;
    if (m.reply_to) {
      replyToMsg = db.prepare(`
        SELECT m.id, m.content, u.username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `).get(m.reply_to);
    }

    const reactions = db.prepare(`
      SELECT mr.emoji, mr.user_id, u.username
      FROM message_reactions mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.message_id = ?
    `).all(m.id);

    return { ...m, reply_to_message: replyToMsg, reactions };
  });

  res.json({ messages: result });
});

router.post('/conversations', auth, (req, res) => {
  const { participantId } = req.body;

  const existing = db.prepare(`
    SELECT c.id FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
    WHERE (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
  `).get(req.user.id, participantId);

  if (existing) {
    return res.json({ conversation: { id: existing.id } });
  }

  const result = db.prepare('INSERT INTO conversations DEFAULT VALUES').run();
  db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, req.user.id);
  db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, participantId);

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
  res.json({ conversation });
});

router.post('/messages/:id/react', auth, (req, res) => {
  const { emoji } = req.body;
  const messageId = req.params.id;

  const existing = db.prepare(
    'SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?'
  ).get(messageId, req.user.id, emoji);

  if (existing) {
    db.prepare('DELETE FROM message_reactions WHERE id = ?').run(existing.id);
    return res.json({ action: 'removed' });
  }

  db.prepare(
    'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)'
  ).run(messageId, req.user.id, emoji);

  const reactions = db.prepare(`
    SELECT mr.emoji, mr.user_id, u.username
    FROM message_reactions mr
    JOIN users u ON mr.user_id = u.id
    WHERE mr.message_id = ?
  `).all(messageId);

  res.json({ action: 'added', reactions });
});

module.exports = router;
