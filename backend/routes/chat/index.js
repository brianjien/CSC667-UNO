// backend/routes/chat/index.js

import express from 'express';
import { join } from 'path';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('chat/index');
});

router.get('/message', (req, res) => {
    res.sendFile(join(__dirname, '..', '..', 'frontend', 'event-handlers', 'chat-message.ejs'));
  });
  
export default router;
