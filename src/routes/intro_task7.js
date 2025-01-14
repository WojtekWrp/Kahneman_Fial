const express = require('express');
const router = express.Router();

// GET /intro_task7
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas || 5; 
  console.log('[introTask7Router] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS, np. 'intro_task7.ejs'
  res.render('intro_task7', { wylosowanyCzas });
});

module.exports = router;