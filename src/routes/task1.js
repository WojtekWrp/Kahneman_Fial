const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

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
    console.log('[POST /task1] GET nie został odwiedzony — redirect');
    return res.redirect('/task1');
  }

  const { task1Token: bodyToken, choice, timeout: timeoutRaw } = req.body;

  if (bodyToken !== req.session.task1Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (!req.session.completedTasks.includes('task1')) {
    req.session.completedTasks.push('task1');
  }

  const timeout = timeoutRaw === 'true';
  const now = Date.now();
  const startTimestamp = req.session.taskStart || now;
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;
  const maxCzas = req.session.maxCzas || 0;

  let wynik = 0;
  if (!timeout) {
    wynik = (choice === 'green') ? 0 : 1;
  }

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(r => r.task === 'task1')) {
    req.session.quizResults.push({ task: 'task1', result: wynik });
  }

  try {
    await db.query(
      `INSERT INTO kolory (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout) VALUES (?, ?, ?, ?, ?)`,
      [
        req.session.sessionID,
        maxCzas,
        czasOdpowiedziRzeczywisty,
        wynik,
        timeout ? 1 : 0
      ]
    );

    // Czyszczenie stanu
    delete req.session.visitedTask1Get;
    delete req.session.task1Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // Zapis sesji i redirect
    req.session.save(err => {
      if (err) {
        console.error('Błąd zapisu sesji (task1):', err);
        return res.status(500).send('Błąd sesji');
      }
      res.redirect('/intro_task2');
    });

  } catch (err) {
    console.error('Błąd zapisu w Task1:', err.message);
    res.status(500).send('Błąd zapisu');
  }
});

module.exports = router;
