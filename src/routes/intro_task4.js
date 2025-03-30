const express = require('express');
const router = express.Router();

// GET /intro_task4
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas ; 
  console.log('[introTask4Router] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS, np. 'intro_task4.ejs'
  res.render('intro_task4', { wylosowanyCzas });
});

router.post('/', (req, res) => {
  res.redirect('/task4');
  });

module.exports = router;