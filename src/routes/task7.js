const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /task7
router.get('/', (req, res) => {
  req.session.visitedTask7Get = true;
  req.session.taskStart = Date.now();

  const isNegative = Math.random() < 0.5;
  const wersja = isNegative ? 'negative' : 'positive';
  req.session.wersja = wersja;
  console.log("wylosowana wersja:", wersja, "sessionID:", req.sessionID);

  const task7Token = crypto.randomBytes(16).toString('hex');
  req.session.task7Token = task7Token;

  res.render('task7', {
    wersja,
    task7Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task7
router.post('/', async (req, res) => {
  if (!req.session.visitedTask7Get) {
    console.log("[POST /task7] Nie odwiedził GET /task7 → redirect");
    return res.redirect('/task7');
  }

  const { task7Token: bodyToken } = req.body;
  console.log("[POST /task7] bodyToken:", bodyToken, "sessionToken:", req.session.task7Token, "SESSION ID:", req.sessionID);

  if (bodyToken !== req.session.task7Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (req.session.completedTasks.includes('task7')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  const timeout = req.body.timeout === 'true';
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  const wersja = req.session.wersja || 'unknown';
  const ubezpieczenie = req.body.ubezpieczenie;

  let wynik;
  if (timeout) {
    wynik = 0;
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (ubezpieczenie === 'True') ? 0 : 1;
  }

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task7')) {
    req.session.quizResults.push({ task: 'task7', result: wynik });
  }

  console.log('[POST /task7]', {
    wersja,
    czasOdpowiedziRzeczywisty,
    wynik,
    ubezpieczenie
  });

  const sql = `
    INSERT INTO framing (id_sesji, wersja, czas_odpowiedzi, wynik, timeout)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [
      req.session.sessionId,
      wersja,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ]);

    req.session.completedTasks.push('task7');

    delete req.session.visitedTask7Get;
    delete req.session.task7Token;
    delete req.session.wersja;
    delete req.session.taskStart;

    res.redirect('/intro_task8');
  } catch (err) {
    console.error('Błąd przy zapisie do framing:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
