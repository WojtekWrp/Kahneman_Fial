const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task1
router.get('/', (req, res) => {
  // 1. Ustawiamy flagę, by zaznaczyć, że odwiedzono GET /task1
  req.session.visitedTask1Get = true;

  // 2. Ustawiamy moment startu w sesji
  req.session.taskStart = Date.now();

  // 3. Odczytujemy maxCzas z sesji (np. ustawiony w /intro_task1)
  const wylosowanyCzas = req.session.maxCzas;

  // 4. Generujemy unikalny token i zapisujemy go w sesji
  const task1Token = crypto.randomBytes(16).toString('hex');
  req.session.task1Token = task1Token;

  console.log('[GET /task1]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    generatedToken: task1Token
  });

  // 5. Render widoku EJS
  res.render('task1', {
    wylosowanyCzas,
    task1Token, // <-- To wstawisz w <input type="hidden" name="task1Token" ...> w widoku
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task1
router.post('/', (req, res) => {
  // 1. Sprawdzamy, czy odwiedzono GET
  if (!req.session.visitedTask1Get) {
    console.log('[POST /task1] Użytkownik nie przeszedł przez GET /task1');
    return res.redirect('/task1');
  }

  // 2. Odczytujemy token z formularza
  const { task1Token: bodyToken } = req.body;
  console.log("[POST /task1]", {
    bodyToken,
    sessionToken: req.session.task1Token,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task1Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // 4. Ensure `completedTasks` jest tablicą
  req.session.completedTasks = req.session.completedTasks || [];

  // 5. Sprawdzenie, czy zadanie zostało już ukończone
  if (req.session.completedTasks.includes('task1')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 6. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log("czy wysłany po timeoucie?", timeout);

  // 7. Obliczamy czas odpowiedzi
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  // 8. Inne dane z formularza
  const choice = req.body.choice;
  const maxCzas = req.session.maxCzas;

  // 9. Ustalamy wynik
  let wynik;
  if (timeout) {
    wynik = 0; // zadanie niewykonane jeżeli timeout
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (choice === 'green') ? 0 : 1;
  }

  console.log('[POST /task1] Obliczony wynik:', wynik, 'Czas odpowiedzi:', czasOdpowiedziRzeczywisty);


  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task1')) {
    req.session.quizResults.push({ task: 'task1', result: wynik });
  }




  // 10. Zapis do bazy
  const sql = `
    INSERT INTO kolory (
      id_sesji, 
      max_czas, 
      czas_odpowiedzi, 
      wynik,
      timeout
    ) 
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      req.session.sessionId,
      maxCzas,
      czasOdpowiedziRzeczywisty,
      wynik,
      timeout ? 1 : 0
    ],
    (err) => {
      if (err) {
        console.error('Błąd zapisu w Task1:', err.message);
        return res.status(500).send('Błąd zapisu');
      }

      // Oznaczenie zadania jako ukończone
      req.session.completedTasks.push('task1');

      // 11. Usuwamy dane z sesji po ukończeniu zadania
      delete req.session.visitedTask1Get;
      delete req.session.task1Token;
      delete req.session.maxCzas;
      delete req.session.taskStart;

      // 12. Przejście do kolejnego zadania
      res.redirect('/intro_task2');
    }
  );
});

module.exports = router;
