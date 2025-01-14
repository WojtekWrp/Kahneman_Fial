const express = require('express');
const router = express.Router();

// GET /intro_task5
router.get('/', (req, res) => {
  // Odczytujemy, co wylosował app.js
  const wylosowanyCzas = req.session.maxCzas || 5; 
  console.log('[introTask5Router] wylosowanyCzas =', wylosowanyCzas);

  // Renderujemy widok EJS, np. 'intro_task5.ejs'
  res.render('intro_task5', { wylosowanyCzas });
});

router.post('/', (req, res) => {
  res.redirect('/task5');
  });
module.exports = router;