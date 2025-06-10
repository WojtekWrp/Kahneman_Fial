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
    console.log('[POST /task4] Brak visitedTask4Get, redirect do /task4');
    return res.redirect('/task4');
  }

  const { task4Token: bodyToken, newsletter, timeout: timeoutRaw } = req.body;
  const sessionToken = req.session.task4Token;

  console.log('[POST /task4]', {
    bodyToken,
    sessionToken,
    sessionID: req.sessionID
  });

  if (bodyToken !== sessionToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];
  if (!req.session.completedTasks.includes('task4')) {
    req.session.completedTasks.push('task4');
  }

  const timeout = timeoutRaw === 'true';
  const now = Date.now();
  const startTimestamp = req.session.taskStart || now;
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;
  const maxCzas = req.session.maxCzas || 5;

  const wynik = timeout ? 0 : (newsletter === '1' ? 1 : 0);

  console.log('[POST /task4] Dane do bazy:', {
    newsletter,
    wynik,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    timeout
  });

  req.session.quizResults = req.session.quizResults || [];
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
      req.session.sessionID,
      maxCzas,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ]);

    // Czyszczenie sesji
    delete req.session.visitedTask4Get;
    delete req.session.task4Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // Zapisz sesję i dopiero przekieruj
    req.session.save(err => {
      if (err) {
        console.error('[POST /task4] Błąd zapisu sesji:', err);
        return res.status(500).send('Błąd sesji');
      }
      res.redirect('/intro_task5');
    });

  } catch (err) {
    console.error('Błąd przy zapisie do bazy (task4):', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
