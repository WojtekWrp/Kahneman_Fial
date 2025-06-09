const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /feedback – wyświetlenie formularza
router.get('/', (req, res) => {
  req.session.visitedFeedbackGet = true;

  const feedbackToken = crypto.randomBytes(16).toString('hex');
  req.session.feedbackToken = feedbackToken;

  req.session.taskStart = Date.now();

  console.log('[GET /feedback]', {
    feedbackToken,
    sessionID: req.sessionID
  });

  res.render('feedback', {
    feedbackToken,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /feedback – zapis oceny
router.post('/', async (req, res) => {
  if (!req.session.visitedFeedbackGet) {
    console.log('[POST /feedback] Nie odwiedził GET, redirect do /feedback');
    return res.redirect('/feedback');
  }

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

  req.session.completedTasks = req.session.completedTasks || [];

  if (req.session.completedTasks.includes('feedback')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  const sql = `
    INSERT INTO session_mark (id_sesji, ocena)
    VALUES (?, ?)
  `;

  try {
    await db.query(sql, [req.session.sessionID, ocena]);

    console.log('Zapisano ocenę w session_mark:', ocena);

    req.session.completedTasks.push('feedback');

    delete req.session.visitedFeedbackGet;
    delete req.session.feedbackToken;
    delete req.session.taskStart;

    res.redirect('/outro');
  } catch (err) {
    console.error('Błąd przy zapisie do session_mark:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
