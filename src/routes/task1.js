const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Upewnij się, że db = pool.promise()

// GET /task1
router.get('/', (req, res) => {
  req.session.visitedTask1Get = true;
  req.session.taskStart = Date.now();

  const wylosowanyCzas = req.session.maxCzas;
  const task1Token = crypto.randomBytes(16).toString('hex');
  req.session.task1Token = task1Token;

  console.log('[GET /task1]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    generatedToken: task1Token
  });

  res.render('task1', {
    wylosowanyCzas,
    task1Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task1
router.post('/', async (req, res) => {
  if (!req.session.visitedTask1Get) {
    console.log('[POST /task1] Użytkownik nie przeszedł przez GET /task1');
    return res.redirect('/task1');
  }

  const { task1Token: bodyToken } = req.body;

  if (bodyToken !== req.session.task1Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  // if (req.session.completedTasks.includes('task1')) {
  //   return res.status(400).send('To zadanie zostało już ukończone.');
  // }

  const timeout = req.body.timeout === 'true';
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  const choice = req.body.choice;
  const maxCzas = req.session.maxCzas;

  let wynik = 0;
  if (!timeout) {
    wynik = (choice === 'green') ? 0 : 1;
  }

  console.log('[POST /task1] Obliczony wynik:', choice, wynik, 'Czas odpowiedzi:', czasOdpowiedziRzeczywisty);

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task1')) {
    req.session.quizResults.push({ task: 'task1', result: wynik });
  }

  const sql = `
    INSERT INTO kolory (
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
      req.session.sessionID,
      maxCzas,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ]);

    req.session.completedTasks.push('task1');

    delete req.session.visitedTask1Get;
    delete req.session.task1Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    res.redirect('/intro_task2');
  } catch (err) {
    console.error('Błąd zapisu w Task1:', err.message);
    res.status(500).send('Błąd zapisu');
  }
});

module.exports = router;
