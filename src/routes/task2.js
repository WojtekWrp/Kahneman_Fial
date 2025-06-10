const express = require('express');
const router = express.Router();
const db = require('../config/db'); // <- zakładamy db = pool.promise()
const crypto = require('crypto');

// GET /task2 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedTask2Get = true;

  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /task2] wylosowanyCzas =', wylosowanyCzas, 'sessionID =', req.sessionID);

  req.session.taskStart = Date.now();

  const task2Token = crypto.randomBytes(16).toString('hex');
  req.session.task2Token = task2Token;

  res.render('task2', {
    wylosowanyCzas,
    task2Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task2 – obsługa formularza
router.post('/', async (req, res) => {
  if (!req.session.visitedTask2Get) {
    console.log('[POST /task2] Brak visitedTask2Get, redirect na /task2');
    return res.redirect('/task2');
  }

  const { task2Token: bodyToken } = req.body;
  console.log('[POST /task2] bodyToken =', bodyToken, 'sessionToken =', req.session.task2Token, 'sessionID =', req.sessionID);

  if (bodyToken !== req.session.task2Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  // if (req.session.completedTasks.includes('task2')) {
  //   return res.status(400).send('To zadanie zostało już ukończone.');
  // }

  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  const timeout = req.body.timeout === 'true';
  const choice = req.body.choice;
  const maxCzas = req.session.maxCzas || 5;

  let wynik = 0;
  if (!timeout) {
    wynik = (choice === 'cancel') ? 1 : 0;
  } else {
    console.log('Zadanie zakończone przez timeout');
  } 

  console.log('[POST /task2] Zapis do bazy:', {
    choice,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout
  });

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task2')) {
    req.session.quizResults.push({ task: 'task2', result: wynik });
  }

  const sql = `
    INSERT INTO false_hierarchy 
      (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout)
    VALUES 
      (?, ?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [
      req.session.sessionID,
      maxCzas,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ]);

    req.session.completedTasks.push('task2');

    delete req.session.visitedTask2Get;
    delete req.session.task2Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    res.redirect('/intro_nudging2');
  } catch (err) {
    console.error('Błąd przy zapisie wyniku dla zadania 2:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
