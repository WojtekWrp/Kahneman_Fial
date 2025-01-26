const express = require('express');
const router = express.Router();

// GET /
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas || 5; 
  console.log('[intro_nudging3] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS
  res.render('intro_nudging3', { wylosowanyCzas });
});
router.post('/', (req, res) => {
res.redirect('/nudging3');
});

module.exports = router;