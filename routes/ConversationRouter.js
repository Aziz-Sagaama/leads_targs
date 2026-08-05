const express = require('express');
const db      = require('../config/db');
const router  = express.Router();

// GET /api/conversations/:id/messages
router.get('/:id/messages', async (req, res) => {
  try {
    const [messages] = await db.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY idMessage ASC',
      [req.params.id]
    );
    res.json(messages);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/conversations/:id/interactions
router.get('/:id/interactions', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM interactions WHERE conversation_id = ?',
    [req.params.id]
  );
  res.json(rows);
});

module.exports = router;