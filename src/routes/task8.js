const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /task8 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedTask8Get = true;

  const maxCzas = 30;
  const isTricked = Math.random() < 0.5;

  req.session.maxCzas = maxCzas;
  req.session.isTricked = isTricked;

  const task8Token = crypto.randomBytes(16).toString('hex');
  req.session.task8Token = task8Token;

  req.session.taskStart = Date.now();

  console.log('[GET /task8]', {
    isTricked,
    maxCzas,
    taskStart: req.session.taskStart,
    sessionID: req.sessionID,
    task8Token
  });

  res.render('task8', {
    isTricked,
    maxCzas,
    task8Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task8 – zapis wyniku
router.post('/', async (req, res) => {
  if (!req.session.visitedTask8Get) {
    console.log('[POST /task8] Nie odwiedził GET /task8 → redirect');
    return res.redirect('/task8');
  }

  const { task8Token: bodyToken } = req.body;
  console.log('[POST /task8]', {
    bodyToken,
    sessionToken: req.session.task8Token,
    sessionID: req.sessionID
  });

  if (bodyToken !== req.session.task8Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (req.session.completedTasks.includes('task8')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  const timeout = req.body.timeout === 'true';
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdKlikniecia = (now - startTimestamp) / 1000;

  const isTricked = req.session.isTricked || false;
  const wersja = isTricked ? 'tricked' : 'normal';
  const koszulka = req.body.koszulka;

  let wynik;
  if (timeout) {
    wynik = 0;
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (koszulka === 'True') ? 0 : 1;
    console.log('wynik z else:', wynik);
  }

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task8')) {
    req.session.quizResults.push({ task: 'task8', result: wynik });
  }

  console.log('[POST /task8]', {
    wersja,
    czasOdKlikniecia,
    wynik
  });

  const updateSessionSql = `
    UPDATE sesja
    SET koniec_sesji = CURRENT_TIMESTAMP
    WHERE id_sesji = ?
  `;

  const insertSql = `
    INSERT INTO socialproof (id_sesji, wersja, czas_odpowiedzi, wynik, timeout)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await db.query(updateSessionSql, [req.session.sessionID]);
    console.log('Czas zakończenia sesji został zaktualizowany.');

    await db.query(insertSql, [
      req.session.sessionID,
      wersja,
      czasOdKlikniecia,
      wynik,
      timeout ? 1 : 0
    ]);

    req.session.completedTasks.push('task8');

    delete req.session.visitedTask8Get;
    delete req.session.task8Token;
    delete req.session.maxCzas;
    delete req.session.isTricked;
    delete req.session.taskStart;

    res.redirect('/feedback');
  } catch (err) {
    console.error('Błąd przy zapisie do socialproof:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
