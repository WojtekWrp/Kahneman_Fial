const express = require('express');
const router = express.Router();

// GET /intro_task8
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas; 
  console.log('[introTask7Router] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS, np. 'intro_task8.ejs'
  res.render('intro_task8', { wylosowanyCzas });
});

router.post('/', (req, res) => {
  res.redirect('/task8');
  });

module.exports = router;