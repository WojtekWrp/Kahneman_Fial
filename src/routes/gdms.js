const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Mapa: nr pytania → kategoria
const categoryMap = {
  1: 'intuitive',    2: 'dependency', 3: 'intuitive',   4: 'rational',    5: 'dependency',
  6: 'avoidance',    7: 'rational',   8: 'instant',     9: 'instant',     10: 'dependency',
  11: 'rational',    12: 'intuitive', 13: 'rational',   14: 'avoidance',  15: 'instant',
  16: 'intuitive',   17: 'intuitive', 18: 'dependency', 19: 'avoidance',  20: 'instant',
  21: 'avoidance',   22: 'dependency',23: 'avoidance',  24: 'instant',    25: 'rational'
};

// GET – wyświetlenie formularza
router.get('/', (req, res) => {
  res.render('gdms'); // widok EJS
});

router.post('/', async (req, res) => {
  const answers = req.body;

  const totals = {
    intuitive: 0,
    rational: 0,
    dependency: 0,
    instant: 0,
    avoidance: 0
  };

  // Sumowanie punktów według kategorii
  for (let i = 1; i <= 25; i++) {
    const q = `q${i}`;
    const value = parseInt(answers[q], 10);
    const category = categoryMap[i];

    if (!isNaN(value) && category in totals) {
      totals[category] += value;
    }
  }

  const id_sesji = req.session.sessionId;

  const insertQuery = `
    INSERT INTO GDMS (
      id_sesji,
      points_intuitive,
      points_rational,
      points_dependency,
      points_instant,
      points_avoidance
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

 
  const values = [
    id_sesji,
    totals.intuitive,
    totals.rational,
    totals.dependency,
    totals.instant,
    totals.avoidance
  ];
    // Zapisz wyniki do sesji, żeby były dostępne w innych widokach
    req.session.gdmsResults = {
    intuitive: totals.intuitive,
    rational: totals.rational,
    dependency: totals.dependency,
    instant: totals.instant,
    avoidance: totals.avoidance
  };

  try {
    await db.query(insertQuery, values);

    // Przejdź dalej
    res.redirect('/intro_nudging1');
  } catch (err) {
    console.error('Błąd przy zapisie do bazy:', err.message);
    res.status(500).send('Wystąpił błąd serwera.');
  }


});

module.exports = router;
