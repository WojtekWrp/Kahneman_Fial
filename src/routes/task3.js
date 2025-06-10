const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db = pool.promise()

// GET /task3
router.get('/', (req, res) => {
  req.session.visitedTask3Get = true;
  req.session.taskStart = Date.now();

  const wylosowanyCzas = req.session.maxCzas;
  const task3Token = crypto.randomBytes(16).toString('hex');
  req.session.task3Token = task3Token;

  console.log('[GET /task3]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    token: task3Token
  });

  res.render('task3', {
    wylosowanyCzas,
    task3Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task3
router.post('/', async (req, res) => {
  if (!req.session.visitedTask3Get) {
    console.log('[POST /task3] Brak visitedTask3Get, redirect do /task3');
    return res.redirect('/task3');
  }

  const { task3Token: bodyToken, choice, timeout: timeoutRaw } = req.body;
  const sessionToken = req.session.task3Token;

  console.log('[POST /task3]', {
    bodyToken,
    sessionToken,
    sessionID: req.sessionID
  });

  if (bodyToken !== sessionToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (!req.session.completedTasks.includes('task3')) {
    req.session.completedTasks.push('task3');
  }

  const timeout = timeoutRaw === 'true';
  const now = Date.now();
  const startTimestamp = req.session.taskStart || now;
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;
  const maxCzas = req.session.maxCzas;

  let wynik = timeout ? 0 : (choice === 'without_insurance' ? 1 : 0);

  console.log('[POST /task3] Zapis do bazy:', {
    choice,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout
  });

  req.session.quizResults = req.session.quizResults || [];
  if (!req.session.quizResults.some(r => r.task === 'task3')) {
    req.session.quizResults.push({ task: 'task3', result: wynik });
  }

  const sql = `
    INSERT INTO misdirections 
      (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout)
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
    delete req.session.visitedTask3Get;
    delete req.session.task3Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // Bezpieczny redirect – po zapisie sesji
    req.session.save(err => {
      if (err) {
        console.error('[POST /task3] Błąd zapisu sesji:', err);
        return res.status(500).send('Błąd sesji');
      }
      res.redirect('/intro_task4');
    });

  } catch (err) {
    console.error('Błąd przy zapisie wyniku dla task3:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
