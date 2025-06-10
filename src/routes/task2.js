const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /task2
router.get('/', (req, res) => {
  req.session.visitedTask2Get = true;
  req.session.taskStart = Date.now();

  const wylosowanyCzas = req.session.maxCzas;
  const task2Token = crypto.randomBytes(16).toString('hex');
  req.session.task2Token = task2Token;

  console.log('[GET /task2]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    token: task2Token
  });

  res.render('task2', {
    wylosowanyCzas,
    task2Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task2
router.post('/', async (req, res) => {
  if (!req.session.visitedTask2Get) {
    console.log('[POST /task2] Brak visitedTask2Get, redirect do /task2');
    return res.redirect('/task2');
  }

  const { task2Token: bodyToken, choice, timeout: timeoutRaw } = req.body;
  const sessionToken = req.session.task2Token;

  console.log('[POST /task2]', {
    bodyToken,
    sessionToken,
    sessionID: req.sessionID
  });

  if (bodyToken !== sessionToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (!req.session.completedTasks.includes('task2')) {
    req.session.completedTasks.push('task2');
  }

  const timeout = timeoutRaw === 'true';
  const now = Date.now();
  const startTimestamp = req.session.taskStart || now;
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;
  const maxCzas = req.session.maxCzas || 5;

  let wynik = 0;
  if (!timeout) {
    wynik = (choice === 'cancel') ? 1 : 0;
  } else {
    console.log('[POST /task2] Timeout odpowiedzi');
  }

  console.log('[POST /task2] Wpis do bazy:', {
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout
  });

  req.session.quizResults = req.session.quizResults || [];
  if (!req.session.quizResults.some(r => r.task === 'task2')) {
    req.session.quizResults.push({ task: 'task2', result: wynik });
  }

  try {
    await db.query(`
      INSERT INTO false_hierarchy 
        (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.session.sessionID,
      maxCzas,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ]);

    // Czyścimy sesję
    delete req.session.visitedTask2Get;
    delete req.session.task2Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // Zapisujemy sesję
    req.session.save(err => {
      if (err) {
        console.error('Błąd zapisu sesji (task2):', err);
        return res.status(500).send('Błąd sesji');
      }
      res.redirect('/intro_nudging2');
    });

  } catch (err) {
    console.error('Błąd przy zapisie wyniku task2:', err.message);
    res.status(500).send('Błąd zapisu wyników.');
  }
});

module.exports = router;
