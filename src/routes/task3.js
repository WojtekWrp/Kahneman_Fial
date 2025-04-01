const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task3 – wyświetlenie zadania
router.get('/', (req, res) => {
  // 1. Flaga: odwiedzono GET /task3
  req.session.visitedTask3Get = true;

  // 2. Odczytujemy wylosowany czas z sesji (np. ustawiony w /intro_task3)
  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /task3]', { wylosowanyCzas, sessionID: req.sessionID });

  // 3. Ustawiamy początek zadania (czas startu)
  req.session.taskStart = Date.now();

  // 4. Generujemy unikalny token i zapisujemy w sesji
  const task3Token = crypto.randomBytes(16).toString('hex');
  req.session.task3Token = task3Token;

  // 5. Renderujemy widok `task3.ejs`
  res.render('task3', {
    wylosowanyCzas,
    task3Token, // <-- to wstaw w <input type="hidden" name="task3Token" value="<%= task3Token %>">
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task3 – obsługa formularza zadania 3
router.post('/', (req, res) => {
  // 1. Sprawdź, czy odwiedzono GET
  if (!req.session.visitedTask3Get) {
    console.log('[POST /task3] Użytkownik nie przeszedł przez GET /task3');
    return res.redirect('/task3');
  }

  // 2. Odczytujemy token z formularza
  const { task3Token: bodyToken } = req.body;
  console.log("[POST /task3]", {
    bodyToken,
    sessionToken: req.session.task3Token,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task3Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists
  req.session.completedTasks = req.session.completedTasks || [];

  // 4. Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task3')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 5. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';

  // 6. Odczytujemy moment startu (jeśli brak, bierzemy 0)
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  // 7. Pobieramy wybór z formularza i maxCzas z sesji
  const { choice } = req.body;
  const maxCzas = req.session.maxCzas;



  

  // 8. Wyliczamy wynik (przykładowa logika)
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


  // 9. Zapis do tabeli 'misdirections'
  const sql = `
    INSERT INTO misdirections (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout)
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
      console.error('Błąd przy zapisie wyniku dla zadania 3:', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    // 10. Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task3');

    // 11. Czyścimy dane
    delete req.session.visitedTask3Get;
    delete req.session.task3Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // 12. Przekierowanie do kolejnego intro (np. /intro_task4)
    res.redirect('/intro_task4');
  });
});

module.exports = router;
