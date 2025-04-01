const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task8 – wyświetlenie zadania (czas zawsze 30s)
router.get('/', (req, res) => {
  // 1. Flaga: user odwiedził GET /task8
  req.session.visitedTask8Get = true;

  // 2. Ustawiamy stałe 30s w tym zadaniu
  const maxCzas = 30;

  
   const isTricked = Math.random() < 0.5;


  // Zapis w sesji
  req.session.maxCzas = maxCzas;
  req.session.isTricked = isTricked;

  // 3. Generujemy unikalny token
  const task8Token = crypto.randomBytes(16).toString('hex');
  req.session.task8Token = task8Token;

  // 4. Zapisujemy moment startu
  req.session.taskStart = Date.now();

  console.log('[GET /task8]', {
    isTricked,
    maxCzas,
    taskStart: req.session.taskStart,
    sessionID: req.sessionID,
    task8Token
  });

  // 5. Renderujemy widok task8.ejs
  //    W widoku użyj: <input type="hidden" name="task8Token" value="<%= task8Token %>">
  res.render('task8', {
    isTricked,
    maxCzas,
    task8Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task8 – zapis wyniku w tabeli `socialproof`
router.post('/', (req, res) => {
  // 1. Sprawdź, czy odwiedzono GET
  if (!req.session.visitedTask8Get) {
    console.log('[POST /task8] Nie odwiedził GET /task8 → redirect');
    return res.redirect('/task8');
  }

  // 2. Pobierz token z formularza
  const { task8Token: bodyToken } = req.body;
  console.log('[POST /task8]', {
    bodyToken,
    sessionToken: req.session.task8Token,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task8Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` as array
  req.session.completedTasks = req.session.completedTasks || [];

  // 4. Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task8')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 5. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log("czy wysłany po timeoucie?", timeout);

  // 6. Odczytujemy czas startu
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdKlikniecia = (now - startTimestamp) / 1000;

  // 7. Odczytujemy dane z sesji
  const isTricked = req.session.isTricked || false;
  const wersja = isTricked ? 'tricked' : 'normal';

  // 8. Pobieramy choice użytkownika (np. koszulka)
  const koszulka = req.body.koszulka; // 'True' lub '5' lub cokolwiek zależnie od formularza

  // 9. Ustalanie wyniku
  let wynik;
  if (timeout) {
    wynik = 0; 
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (koszulka === 'True') ? 0 : 1;
    console.log('wynik z else:', wynik);
  }

  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task8')) {
    req.session.quizResults.push({ task: 'task8', result: wynik });
  }
  console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);

  console.log('[POST /task8]', {
    wersja,
    czasOdKlikniecia,
    wynik
  });

  // 10. Zapis do bazy (socialproof) + ewentualny update sesji
  const updateSessionSql = `
    UPDATE sesja
    SET koniec_sesji = CURRENT_TIMESTAMP
    WHERE id_sesji = ?
  `; // przykładowe zakończenie sesji w DB

  db.query(updateSessionSql, [req.session.sessionId], (err) => {
    if (err) {
      console.error('Błąd przy aktualizacji koniec_sesji:', err.message);
      return res.status(500).send('Wystąpił błąd podczas aktualizacji czasu zakończenia sesji.');
    }
    console.log('Czas zakończenia sesji został zaktualizowany.');
  });

  const sql = `
    INSERT INTO socialproof (id_sesji, wersja, czas_odpowiedzi, wynik, timeout)
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
      console.error('Błąd przy zapisie do socialproof:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    // 11. Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task8');

    // 12. Czyścimy dane sesji
    delete req.session.visitedTask8Get;
    delete req.session.task8Token;
    delete req.session.maxCzas;
    delete req.session.isTricked;
    delete req.session.taskStart;

    // 13. Przekierowanie do /feedback (albo inny route)
    res.redirect('/feedback');
  });
});

module.exports = router;
