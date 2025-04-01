const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task5 – wyświetlenie zadania
router.get('/', (req, res) => {
  // 1. Flaga: odwiedziliśmy GET /task5
  req.session.visitedTask5Get = true;

  // 2. Ustawiamy moment startu na bieżący czas
  req.session.taskStart = Date.now();

  // 3. Generowanie unikalnego tokenu
  const task5Token = crypto.randomBytes(16).toString('hex');
  req.session.task5Token = task5Token; // Zapis w sesji

  // 4. Odczytujemy maxCzas z sesji
  const wylosowanyCzas = req.session.maxCzas || 5;
  console.log('[GET /task5]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    task5Token
  });

  // 5. Renderujemy widok 'task5.ejs'
  //    W widoku pamiętaj, żeby użyć <input type="hidden" name="task5Token" value="<%= task5Token %>">
  res.render('task5', {
    wylosowanyCzas,
    task5Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task5 – obsługa formularza dla Zadania 5
router.post('/', (req, res) => {
  // 1. Sprawdź, czy odwiedzono GET /task5
  if (!req.session.visitedTask5Get) {
    console.log('[POST /task5] Brak visitedTask5Get, redirect do /task5');
    return res.redirect('/task5');
  }

  // 2. Pobierz token z formularza
  const { task5Token: bodyToken } = req.body;
  console.log("[POST /task5]", {
    bodyToken,
    sessionToken: req.session.task5Token,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task5Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` is an array
  req.session.completedTasks = req.session.completedTasks || [];

  // 4. Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task5')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 5. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log("czy wysłany po timeoucie?", timeout);

  // 6. Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  // 7. Pobieramy choice z formularza (lub cokolwiek w nim jest)
  const { choice } = req.body;
  const maxCzas = req.session.maxCzas || 5;

  // 8. Ustalamy wynik
  let wynik;
  if (timeout) {
    wynik = 0; 
    console.log('Zadanie zakończone przez timeout');
  } else {
    // Przykład logiki: if (choice == 'True') wynik=0, else=1
    wynik = (choice === 'True') ? 0 : 1;
  }

  // 9. (Opcjonalnie) Zbierz dane do quizResults
  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(r => r.task === 'task5')) {
    req.session.quizResults.push({ task: 'task5', result: wynik });
  }
  console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);

  console.log('[POST /task5] Zapis do bazy:', {
    choice,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout
  });

  // 10. Zapis do bazy (tabela 'preselections')
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
  db.query(sql, [
    req.session.sessionId,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout ? 1 : 0
  ], (err) => {
    if (err) {
      console.error('Błąd przy zapisie wyniku dla zadania 5:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    // 11. Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task5');

    // 12. Usuwamy dane z sesji
    delete req.session.visitedTask5Get;
    delete req.session.task5Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // 13. Przekierowanie do /intro_task6
    res.redirect('/intro_task6');
  });
});

module.exports = router;
