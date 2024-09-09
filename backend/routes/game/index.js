// backend/routes/game/index.js

import express from 'express';

const router = express.Router();

router.get('/game', (req, res) => {
  res.render('game/index');
});


export default router;
