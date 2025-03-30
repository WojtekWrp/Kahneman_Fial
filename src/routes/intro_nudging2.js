const express = require('express');
const router = express.Router();

// GET /
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas;
  console.log('[intro_nudging2] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS
  res.render('intro_nudging2', { wylosowanyCzas });
});

router.post('/', (req, res) => {
res.redirect('/nudging2');
});




module.exports = router;