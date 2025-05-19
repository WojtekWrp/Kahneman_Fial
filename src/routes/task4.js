const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /task4 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedTask4Get = true;
  req.session.taskStart = Date.now();

  const wylosowanyCzas = req.session.maxCzas || 5;
  const task4Token = crypto.randomBytes(16).toString('hex');
  req.session.task4Token = task4Token;

  console.log('[GET /task4]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    task4Token
  });

  res.render('task4', {
    wylosowanyCzas,
    task4Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task4 – zapis wyniku
router.post('/', async (req, res) => {
  if (!req.session.visitedTask4Get) {
    console.log('[POST /task4] Użytkownik nie odwiedził GET /task4 → redirect do /task4');
    return res.redirect('/task4');
  }

  const { task4Token: bodyToken } = req.body;
  console.log('[POST /task4]', {
    bodyToken,
    sessionToken: req.session.task4Token,
    sessionID: req.sessionID
  });

  if (bodyToken !== req.session.task4Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (req.session.completedTasks.includes('task4')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  const timeout = req.body.timeout === 'true';
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  const newsletter = req.body.newsletter;
  let wynik;
  if (timeout) {
    wynik = 0;
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (newsletter === '1') ? 1 : 0;
  }

  const maxCzas = req.session.maxCzas || 5;

  console.log('[POST /task4] Zapis do bazy:', {
    newsletter,
    wynik,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    timeout
  });

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task4')) {
    req.session.quizResults.push({ task: 'task4', result: wynik });
  }

  const sql = `
    INSERT INTO questions (
      id_sesji, 
      max_czas, 
      czas_odpowiedzi, 
      wynik, 
      timeout
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [
      req.session.sessionId,
      maxCzas,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ]);

    req.session.completedTasks.push('task4');

    delete req.session.visitedTask4Get;
    delete req.session.task4Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    res.redirect('/intro_task5');
  } catch (err) {
    console.error('Błąd przy zapisie wyniku (task4):', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
