const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task6 – wyświetlenie zadania (czas zawsze 30s)
router.get('/', (req, res) => {
  // 1. Ustawiamy flagę: odwiedziliśmy GET
  req.session.visitedTask6Get = true;

  // 2. Losujemy wersję i ustawiamy w sesji
  const maxCzas = 30;
  const isTricked = Math.random() < 0.5;
  req.session.maxCzas = maxCzas;
  req.session.isTricked = isTricked;
  req.session.taskStart = Date.now();

  // 3. Generujemy unikalny token
  const task6Token = crypto.randomBytes(16).toString('hex');
  req.session.task6Token = task6Token;

  console.log('[GET /task6]', {
    isTricked,
    maxCzas,
    taskStart: req.session.taskStart,
    sessionID: req.sessionID,
    task6Token
  });

  // Renderujemy widok 'task6.ejs'
  res.render('task6', {
    wylosowanyCzas: maxCzas,
    isTricked,
    task6Token, // <input type="hidden" name="task6Token" ...> w EJS
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task6 – zapis wyniku w tabeli `timepressing`
router.post('/', (req, res) => {
  // 1. Sprawdź, czy user odwiedził GET /task6
  if (!req.session.visitedTask6Get) {
    console.log('[POST /task6] Nie odwiedził GET, redirect do /task6');
    return res.redirect('/task6');
  }

  // 2. Pobierz token z formularza
  const { task6Token: bodyToken } = req.body;
  console.log('[POST /task6]', {
    bodyToken,
    sessionToken: req.session.task6Token,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task6Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // 4. Ensure `completedTasks` as array
  req.session.completedTasks = req.session.completedTasks || [];

  // 5. Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task6')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 6. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log('Czy wysłany po timeoucie?', timeout);

  // 7. Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdKlikniecia = (now - startTimestamp) / 1000; // sekundy

  // 8. Odczytujemy dane z sesji
  const isTricked = req.session.isTricked || false;
  const wersja = isTricked ? 'tricked' : 'normal';

  // 9. Sprawdzamy wybór użytkownika (np. zapakowanie)
  const zapakowanie = req.body.zapakowanie; // '5' jeśli zaznaczył, undefined jeśli nie

  // 10. Ustalanie wyniku
  let wynik;
  if (timeout) {
    wynik = 0; // zadanie niewykonane jeżeli timeout
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = zapakowanie ? 0 : 1; 
  }

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task6')) {
    req.session.quizResults.push({ task: 'task6', result: wynik });
  }

  console.log('[POST /task6]', {
    wersja,
    czasOdKlikniecia,
    wynik,
    zapakowanie
  });

  // 11. Zapis do tabeli `timepressing`
  const sql = `
    INSERT INTO timepressing (
      id_sesji, 
      wersja, 
      czas_odpowiedzi, 
      wynik, 
      timeout
    ) 
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    req.session.sessionId,
    wersja,
    czasOdKlikniecia,
    wynik,
    timeout ? 1 : 0
  ], (err) => {
    if (err) {
      console.error('Błąd przy zapisie do timepressing:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    // 12. Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task6');

    // 13. Czyścimy dane z sesji
    delete req.session.visitedTask6Get;
    delete req.session.task6Token;
    delete req.session.maxCzas;
    delete req.session.isTricked;
    delete req.session.taskStart;

    // 14. Przekierowanie do kolejnego zadania
    res.redirect('/intro_nudging3');
  });
});

module.exports = router;
