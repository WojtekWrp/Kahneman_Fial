const express = require('express');
const router = express.Router();

// GET /
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas;
  console.log('[intro_nudging1] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS
  res.render('intro_nudging1', { wylosowanyCzas });
});


router.post('/', (req, res) => {
res.redirect('/nudging1');
});




module.exports = router;