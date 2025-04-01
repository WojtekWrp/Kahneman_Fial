const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');

// GET /task7
router.get('/', (req, res) => {
  // 1. Ustawiamy flagę: odwiedziliśmy GET /task7
  req.session.visitedTask7Get = true;

  // 2. Ustawiamy czas startu
  req.session.taskStart = Date.now();

  // 3. Losujemy wersję
  const isNegative = Math.random() < 0.5; // 50% szans
  const wersja = isNegative ? 'negative' : 'positive';
  req.session.wersja = wersja;
  console.log("wylosowana wersja:", wersja, "sessionID:", req.sessionID);

  // 4. Generujemy token
  const task7Token = crypto.randomBytes(16).toString('hex');
  req.session.task7Token = task7Token;

  // 5. Renderujemy widok 'task7.ejs'
  //    Upewnij się, że w widoku używasz <input type="hidden" name="task7Token" value="<%= task7Token %>" />
  res.render('task7', {
    wersja,
    task7Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task7 – obsługa formularza (ubezpieczenie / brak ubezpieczenia)
router.post('/', (req, res) => {
  // 1. Sprawdź, czy user odwiedził GET
  if (!req.session.visitedTask7Get) {
    console.log("[POST /task7] Nie odwiedził GET /task7 → redirect");
    return res.redirect('/task7');
  }

  // 2. Pobierz token z formularza
  const { task7Token: bodyToken } = req.body;
  console.log("[POST /task7] bodyToken:", bodyToken, "sessionToken:", req.session.task7Token, "SESSION ID:", req.sessionID);

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task7Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // 4. Ensure `completedTasks` as array
  req.session.completedTasks = req.session.completedTasks || [];

  // 5. Sprawdź, czy zadanie nie zostało już ukończone
  if (req.session.completedTasks.includes('task7')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 6. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log("czy wysłany po timeoucie?", timeout);

  // 7. Odczytujemy czas startu
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  // 8. Odczytujemy wersję z sesji
  const wersja = req.session.wersja || 'unknown';

  // 9. Pobieramy wybór użytkownika
  //    np. `ubezpieczenie = req.body.ubezpieczenie;`
  const ubezpieczenie = req.body.ubezpieczenie; // 'True' jeśli zaznaczone?

  // 10. Ustalanie wyniku
  let wynik;
  if (timeout) {
    wynik = 0;
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (ubezpieczenie === 'True') ? 0 : 1;
  }

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task7')) {
    req.session.quizResults.push({ task: 'task7', result: wynik });
  }

  console.log('[POST /task7]', {
    wersja,
    czasOdpowiedziRzeczywisty,
    wynik,
    ubezpieczenie
  });

  // 11. Zapis do bazy, np. `framing`
  const sql = `
    INSERT INTO framing (id_sesji, wersja, czas_odpowiedzi, wynik, timeout)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    req.session.sessionId,
    wersja,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout ? 1 : 0
  ], (err) => {
    if (err) {
      console.error('Błąd przy zapisie do framing:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    // 12. Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task7');

    // 13. Czyścimy dane z sesji
    delete req.session.visitedTask7Get;
    delete req.session.task7Token;
    delete req.session.wersja;
    delete req.session.taskStart;


    // 14. Przekierowanie do /intro_task8 (lub kolejnego)
    res.redirect('/intro_task8');
  });
});

module.exports = router;
