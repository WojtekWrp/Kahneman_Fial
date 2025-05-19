const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /task5 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedTask5Get = true;
  req.session.taskStart = Date.now();

  const task5Token = crypto.randomBytes(16).toString('hex');
  req.session.task5Token = task5Token;

  const wylosowanyCzas = req.session.maxCzas || 5;
  console.log('[GET /task5]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    task5Token
  });

  res.render('task5', {
    wylosowanyCzas,
    task5Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task5 – obsługa formularza dla Zadania 5
router.post('/', async (req, res) => {
  if (!req.session.visitedTask5Get) {
    console.log('[POST /task5] Brak visitedTask5Get, redirect do /task5');
    return res.redirect('/task5');
  }

  const { task5Token: bodyToken } = req.body;
  console.log("[POST /task5]", {
    bodyToken,
    sessionToken: req.session.task5Token,
    sessionID: req.sessionID
  });

  if (bodyToken !== req.session.task5Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (req.session.completedTasks.includes('task5')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  const timeout = req.body.timeout === 'true';
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  const { choice } = req.body;
  const maxCzas = req.session.maxCzas || 5;

  let wynik;
  if (timeout) {
    wynik = 0;
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (choice === 'True') ? 0 : 1;
  }

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(r => r.task === 'task5')) {
    req.session.quizResults.push({ task: 'task5', result: wynik });
  }

  console.log('[POST /task5] Zapis do bazy:', {
    choice,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout
  });

  const sql = `
    INSERT INTO preselections (
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

    req.session.completedTasks.push('task5');

    delete req.session.visitedTask5Get;
    delete req.session.task5Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    res.redirect('/intro_task6');
  } catch (err) {
    console.error('Błąd przy zapisie wyniku dla zadania 5:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
