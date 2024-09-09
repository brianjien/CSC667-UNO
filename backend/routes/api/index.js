// backend/routes/api/index.js

import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('API Index');
});

export default router;
