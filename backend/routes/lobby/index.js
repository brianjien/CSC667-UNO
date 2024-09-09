// backend/routes/lobby/index.js

import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('lobby/index');
});


export default router;
