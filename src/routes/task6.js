const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /task6 – wyświetlenie zadania (czas zawsze 30s)
router.get('/', (req, res) => {
  req.session.visitedTask6Get = true;

  const maxCzas = 30;
  const isTricked = Math.random() < 0.5;
  req.session.maxCzas = maxCzas;
  req.session.isTricked = isTricked;
  req.session.taskStart = Date.now();

  const task6Token = crypto.randomBytes(16).toString('hex');
  req.session.task6Token = task6Token;

  console.log('[GET /task6]', {
    isTricked,
    maxCzas,
    taskStart: req.session.taskStart,
    sessionID: req.sessionID,
    task6Token
  });

  res.render('task6', {
    wylosowanyCzas: maxCzas,
    isTricked,
    task6Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task6 – zapis wyniku
router.post('/', async (req, res) => {
  if (!req.session.visitedTask6Get) {
    console.log('[POST /task6] Nie odwiedził GET, redirect do /task6');
    return res.redirect('/task6');
  }

  const { task6Token: bodyToken, zapakowanie, timeout: timeoutRaw } = req.body;
  const sessionToken = req.session.task6Token;

  console.log('[POST /task6]', {
    bodyToken,
    sessionToken,
    sessionID: req.sessionID
  });

  if (bodyToken !== sessionToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];
  if (!req.session.completedTasks.includes('task6')) {
    req.session.completedTasks.push('task6');
  }

  const timeout = timeoutRaw === 'true';
  const startTimestamp = req.session.taskStart || Date.now();
  const czasOdKlikniecia = (Date.now() - startTimestamp) / 1000;

  const isTricked = req.session.isTricked || false;
  const wersja = isTricked ? 'tricked' : 'normal';

  const wynik = timeout ? 0 : (zapakowanie ? 0 : 1);

  req.session.quizResults = req.session.quizResults || [];
  if (!req.session.quizResults.some(r => r.task === 'task6')) {
    req.session.quizResults.push({ task: 'task6', result: wynik });
  }

  console.log('[POST /task6] Zapis do bazy:', {
    wersja,
    czasOdKlikniecia,
    wynik,
    zapakowanie,
    timeout
  });

  const sql = `
    INSERT INTO timepressing (
      id_sesji, 
      wersja, 
      czas_odpowiedzi, 
      wynik, 
      timeout
    ) VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [
      req.session.sessionID,
      wersja,
      czasOdKlikniecia,
      wynik,
      timeout ? 1 : 0
    ]);

    delete req.session.visitedTask6Get;
    delete req.session.task6Token;
    delete req.session.maxCzas;
    delete req.session.isTricked;
    delete req.session.taskStart;

    req.session.save(err => {
      if (err) {
        console.error('[POST /task6] Błąd zapisu sesji:', err);
        return res.status(500).send('Błąd sesji.');
      }
      res.redirect('/intro_nudging3');
    });

  } catch (err) {
    console.error('Błąd przy zapisie do timepressing:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
