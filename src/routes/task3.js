const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // zakładamy, że db = pool.promise()

// GET /task3 – wyświetlenie zadania
router.get('/', (req, res) => {
  req.session.visitedTask3Get = true;

  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /task3]', { wylosowanyCzas, sessionID: req.sessionID });

  req.session.taskStart = Date.now();

  const task3Token = crypto.randomBytes(16).toString('hex');
  req.session.task3Token = task3Token;

  res.render('task3', {
    wylosowanyCzas,
    task3Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task3 – obsługa formularza
router.post('/', async (req, res) => {
  if (!req.session.visitedTask3Get) {
    console.log('[POST /task3] Użytkownik nie przeszedł przez GET /task3');
    return res.redirect('/task3');
  }

  const { task3Token: bodyToken } = req.body;
  console.log("[POST /task3]", {
    bodyToken,
    sessionToken: req.session.task3Token,
    sessionID: req.sessionID
  });

  if (bodyToken !== req.session.task3Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  req.session.completedTasks = req.session.completedTasks || [];

  if (req.session.completedTasks.includes('task3')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  const timeout = req.body.timeout === 'true';
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  const choice = req.body.choice;
  const maxCzas = req.session.maxCzas;

  let wynik;
  if (timeout) {
    wynik = 0;
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (choice === 'without_insurance') ? 1 : 0;
  }

  console.log('[POST /task3] Zapis do bazy:', {
    choice,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout
  });

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task3')) {
    req.session.quizResults.push({ task: 'task3', result: wynik });
  }

  const sql = `
    INSERT INTO misdirections (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout)
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

    req.session.completedTasks.push('task3');

    delete req.session.visitedTask3Get;
    delete req.session.task3Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    res.redirect('/intro_task4');
  } catch (err) {
    console.error('Błąd przy zapisie wyniku dla zadania 3:', err.message);
    res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
  }
});

module.exports = router;
