const express = require('express');
const router = express.Router();

// GET /intro_task6
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas; 
  console.log('[introTask6Router] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS, np. 'intro_task2.ejs'
  res.render('intro_task6', { wylosowanyCzas });
});

router.post('/', (req, res) => {
  res.redirect('/task6');
  });

module.exports = router;