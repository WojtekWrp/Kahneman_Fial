const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /task2 – wyświetlenie zadania
router.get('/', (req, res) => {
  // 1. Ustawiamy flagę: użytkownik odwiedził GET /task2
  req.session.visitedTask2Get = true;

  // 2. Odczytujemy wylosowany czas (ustawiony np. w /intro_task2)
  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /task2] wylosowanyCzas =', wylosowanyCzas, 'sessionID =', req.sessionID);

  // 3. Ustawiamy początek zadania
  req.session.taskStart = Date.now();

  // 4. Generujemy unikalny token i zapisujemy go w sesji
  const task2Token = crypto.randomBytes(16).toString('hex');
  req.session.task2Token = task2Token;

  // 5. Renderujemy widok EJS 'task2.ejs'
  res.render('task2', {
    wylosowanyCzas,
    task2Token, // <-- to wstawisz w <input type="hidden" name="task2Token" value="<%= task2Token %>">
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task2 – obsługa formularza
router.post('/', (req, res) => {
  // 1. Sprawdzamy, czy użytkownik odwiedził GET /task2
  if (!req.session.visitedTask2Get) {
    console.log('[POST /task2] Brak visitedTask2Get, redirect na /task2');
    return res.redirect('/task2');
  }

  // 2. Odczytujemy token z formularza
  const { task2Token: bodyToken } = req.body;
  console.log('[POST /task2] bodyToken =', bodyToken, 'sessionToken =', req.session.task2Token, 'sessionID =', req.sessionID);

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task2Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists
  req.session.completedTasks = req.session.completedTasks || [];

  // 4. Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task2')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 5. Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  // 6. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log("Czy wysłany po timeoucie?", timeout);

  // 7. Pobieramy choice z formularza (np. "cancel" lub coś innego)
  const { choice } = req.body;
  // Odczytujemy maxCzas z sesji
  const maxCzas = req.session.maxCzas || 5;

  // 8. Wyliczamy wynik
  let wynik;
  if (timeout) {
    wynik = 0; 
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (choice === 'cancel') ? 1 : 0;
  }

  // 9. (Opcjonalnie) logi do quizResults
  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task2')) {
    req.session.quizResults.push({ task: 'task2', result: wynik });
  }


  // 10. Zapis do tabeli false_hierarchy
  const sql = `
    INSERT INTO false_hierarchy 
      (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout)
    VALUES 
      (?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    req.session.sessionId,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout ? 1 : 0
  ], (err) => {
    if (err) {
      console.error('Błąd przy zapisie wyniku dla zadania 2:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    // 11. Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task2');

    // 12. Usunięcie danych z sesji
    delete req.session.visitedTask2Get;
    delete req.session.task2Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // 13. Przekierowanie do kolejnego zadania
    res.redirect('/intro_nudging2');
  });
});

module.exports = router;
