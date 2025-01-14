const express = require('express');
const router = express.Router();

// GET /intro_task1
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas || 5; 
  console.log('[introTask1Router] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS, np. 'intro_task1.ejs'
  res.render('intro_task1', { wylosowanyCzas });
});

module.exports = router;