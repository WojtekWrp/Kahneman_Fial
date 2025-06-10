const express = require('express');
const router = express.Router();
const db = require('../config/db');

const categoryMap = {
  1: 'intuitive', 2: 'dependency', 3: 'intuitive', 4: 'rational', 5: 'dependency',
  6: 'avoidance', 7: 'rational', 8: 'instant', 9: 'instant', 10: 'dependency',
  11: 'rational', 12: 'intuitive', 13: 'rational', 14: 'avoidance', 15: 'instant',
  16: 'intuitive', 17: 'intuitive', 18: 'dependency', 19: 'avoidance', 20: 'instant',
  21: 'avoidance', 22: 'dependency', 23: 'avoidance', 24: 'instant', 25: 'rational'
};

// GET – wyświetlenie formularza
router.get('/', (req, res) => {
  res.render('gdms');
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

  for (let i = 1; i <= 25; i++) {
    const q = `q${i}`;
    const value = parseInt(answers[q], 10); // Pobranie wartości odpowiedzi
    const category = categoryMap[i];

    if (!isNaN(value) && category in totals) {
      totals[category] += value;
    }
  }

  const id_sesji = req.session.sessionID;

  if (!id_sesji) {
    console.warn('Brak sessionID — użytkownik nieprawidłowo zarejestrowany?');
    return res.redirect('/register');
  }

  // Wstaw tylko raz
  const insertQuery = `
    INSERT IGNORE INTO GDMS (
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

  try {
    await db.query(insertQuery, values);

    // Zapamiętaj wynik w sesji (do widoków, jeśli potrzebny)
    req.session.gdmsResults = totals;

    // Zabezpiecz completedTasks jako tablicę
    req.session.completedTasks = req.session.completedTasks || [];

    // Dodaj tylko raz
    if (!req.session.completedTasks.includes('gdms')) {
      req.session.completedTasks.push('gdms');
    }

    // Zapisz sesję, dopiero potem przekieruj
    req.session.save((err) => {
      if (err) {
        console.error('Błąd zapisu sesji:', err);
        return res.status(500).send('Błąd sesji.');
      }
      res.redirect('/intro_nudging1');
    });
  } catch (err) {
    console.error('Błąd przy zapisie do bazy GDMS:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisu wyników.');
  }
});

module.exports = router;
