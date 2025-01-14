const express = require('express');
const router = express.Router();

// GET /intro_task3
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas || 5; 
  console.log('[introTask3Router] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS, np. 'intro_task2.ejs'
  res.render('intro_task3', { wylosowanyCzas });
});

module.exports = router;