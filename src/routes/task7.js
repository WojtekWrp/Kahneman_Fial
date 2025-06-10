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

  const task7Token = crypto.randomBytes(16).toString('hex');
  req.session.task7Token = task7Token;

  console.log('[GET /task7]', {
    wersja,
    sessionID: req.sessionID,
    task7Token
  });

  res.render('task7', {
    wersja,
    task7Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task7
router.post('/', async (req, res) => {
  if (!req.session.visitedTask7Get) {
    console.log('[POST /task7] Pominięty GET, redirect');
    return res.redirect('/task7');
  }

  const { task7Token: bodyToken, ubezpieczenie, timeout: timeoutRaw } = req.body;
  const sessionToken = req.session.task7Token;

  if (bodyToken !== sessionToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];
  if (!req.session.completedTasks.includes('task7')) {
    req.session.completedTasks.push('task7');
  }

  const timeout = timeoutRaw === 'true';
  const startTimestamp = req.session.taskStart || Date.now();
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  const wersja = req.session.wersja || 'unknown';

  let wynik = 0;
  if (!timeout) {
    wynik = (ubezpieczenie === 'True') ? 0 : 1;
  }

  req.session.quizResults = req.session.quizResults || [];
  if (!req.session.quizResults.some(r => r.task === 'task7')) {
    req.session.quizResults.push({ task: 'task7', result: wynik });
  }

  console.log('[POST /task7]', {
    wersja,
    wynik,
    timeout,
    czasOdpowiedziRzeczywisty,
    ubezpieczenie
  });

  const sql = `
    INSERT INTO framing (
      id_sesji, wersja, czas_odpowiedzi, wynik, timeout
    ) VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [
      req.session.sessionID,
      wersja,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ]);

    delete req.session.visitedTask7Get;
    delete req.session.task7Token;
    delete req.session.wersja;
    delete req.session.taskStart;

    req.session.save(err => {
      if (err) {
        console.error('[POST /task7] Błąd zapisu sesji:', err);
        return res.status(500).send('Błąd sesji.');
      }
      res.redirect('/intro_task8');
    });
  } catch (err) {
    console.error('Błąd przy zapisie do framing:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
