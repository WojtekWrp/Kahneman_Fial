const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /task8
router.get('/', (req, res) => {
  req.session.visitedTask8Get = true;

  const maxCzas = 30;
  const isTricked = Math.random() < 0.5;

  req.session.maxCzas = maxCzas;
  req.session.isTricked = isTricked;
  req.session.taskStart = Date.now();

  const task8Token = crypto.randomBytes(16).toString('hex');
  req.session.task8Token = task8Token;

  console.log('[GET /task8]', {
    isTricked,
    maxCzas,
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

// POST /task8
router.post('/', async (req, res) => {
  if (!req.session.visitedTask8Get) {
    console.log('[POST /task8] GET nieodwiedzony → redirect');
    return res.redirect('/task8');
  }

  const { task8Token: bodyToken, koszulka, timeout: timeoutRaw } = req.body;
  const sessionToken = req.session.task8Token;

  if (bodyToken !== sessionToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];
  if (!req.session.completedTasks.includes('task8')) {
    req.session.completedTasks.push('task8');
  }

  const timeout = timeoutRaw === 'true';
  const startTimestamp = req.session.taskStart || Date.now();
  const now = Date.now();
  const czasOdKlikniecia = (now - startTimestamp) / 1000;

  const isTricked = req.session.isTricked || false;
  const wersja = isTricked ? 'tricked' : 'normal';

  let wynik = 0;
  if (!timeout) {
    wynik = koszulka === 'True' ? 0 : 1;
  }

  req.session.quizResults = req.session.quizResults || [];
  if (!req.session.quizResults.some(r => r.task === 'task8')) {
    req.session.quizResults.push({ task: 'task8', result: wynik });
  }

  console.log('[POST /task8]', {
    wersja,
    czasOdKlikniecia,
    wynik,
    timeout,
    koszulka
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
    console.log('Zaktualizowano czas zakończenia sesji.');

    await db.query(insertSql, [
      req.session.sessionID,
      wersja,
      czasOdKlikniecia,
      wynik,
      timeout ? 1 : 0
    ]);

    // Czyścimy dane z sesji
    delete req.session.visitedTask8Get;
    delete req.session.task8Token;
    delete req.session.maxCzas;
    delete req.session.isTricked;
    delete req.session.taskStart;

    // Zapis sesji i redirect
    req.session.save(err => {
      if (err) {
        console.error('Błąd przy zapisie sesji (task8):', err);
        return res.status(500).send('Błąd sesji.');
      }
      res.redirect('/feedback');
    });

  } catch (err) {
    console.error('Błąd przy zapisie do socialproof:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
