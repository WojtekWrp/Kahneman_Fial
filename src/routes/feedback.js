const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /feedback – wyświetlenie formularza
router.get('/', (req, res) => {
  const feedbackToken = crypto.randomBytes(16).toString('hex');
  req.session.feedbackToken = feedbackToken;
  req.session.taskStart = Date.now();

  console.log('[GET /feedback]', {
    feedbackToken,
    sessionID: req.sessionID
  });

  res.render('feedback', {
    feedbackToken
  });
});

// POST /feedback – zapis oceny
router.post('/', async (req, res) => {
  const { feedbackToken: bodyToken, ocena } = req.body;

  console.log('[POST /feedback]', {
    bodyToken,
    sessionToken: req.session.feedbackToken,
    ocena,
    sessionID: req.sessionID
  });

  if (bodyToken !== req.session.feedbackToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  const id_sesji = req.session.sessionID;
  if (!id_sesji) {
    console.warn('[POST /feedback] Brak sessionID');
    return res.redirect('/register');
  }

  try {
    // Wstaw ocenę tylko raz
    await db.query(
      `
      INSERT IGNORE INTO session_mark (id_sesji, ocena)
      VALUES (?, ?)
      `,
      [id_sesji, ocena]
    );

    req.session.completedTasks = req.session.completedTasks || [];
    if (!req.session.completedTasks.includes('feedback')) {
      req.session.completedTasks.push('feedback');
    }

    // Wyczyść tymczasowe dane z sesji
    delete req.session.feedbackToken;
    delete req.session.taskStart;

    // Zapewnij zapis sesji przed redirectem
    req.session.save((err) => {
      if (err) {
        console.error('Błąd zapisu sesji:', err);
        return res.status(500).send('Błąd sesji.');
      }
      res.redirect('/outro');
    });

  } catch (err) {
    console.error('Błąd przy zapisie do session_mark:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
