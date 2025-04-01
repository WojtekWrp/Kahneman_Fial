const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task4 – wyświetlenie zadania
router.get('/', (req, res) => {
  // 1. Flaga: odwiedziliśmy GET /task4
  req.session.visitedTask4Get = true;

  // 2. Zapisanie startu zadania
  req.session.taskStart = Date.now();

  // 3. Odczytujemy maxCzas z sesji (np. ustawiony wcześniej w /intro_task4)
  const wylosowanyCzas = req.session.maxCzas || 5;

  // 4. Generujemy unikalny token dla task4
  const task4Token = crypto.randomBytes(16).toString('hex');
  req.session.task4Token = task4Token;

  console.log('[GET /task4]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
    task4Token
  });

  // 5. Renderujemy widok 'task4.ejs'
  //    W widoku pamiętaj o <input type="hidden" name="task4Token" value="<%= task4Token %>" />
  res.render('task4', {
    wylosowanyCzas,
    task4Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /task4 – zapis wyniku
router.post('/', (req, res) => {
  // 1. Sprawdź, czy przeszliśmy przez GET
  if (!req.session.visitedTask4Get) {
    console.log('[POST /task4] Użytkownik nie odwiedził GET /task4 → redirect do /task4');
    return res.redirect('/task4');
  }

  // 2. Pobierz token z formularza
  const { task4Token: bodyToken } = req.body;
  console.log('[POST /task4]', {
    bodyToken,
    sessionToken: req.session.task4Token,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.task4Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // 4. Ensure completedTasks jest tablicą
  req.session.completedTasks = req.session.completedTasks || [];

  // 5. Sprawdzenie, czy zadanie zostało już ukończone
  if (req.session.completedTasks.includes('task4')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 6. Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log("czy wysłany po timeoucie?", timeout);

  // 7. Zaczytujemy moment startu (lub 0)
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  // 8. Pobieramy wartość z formularza (checkbox newsletter?)
  const newsletter = req.body.newsletter; // '1' jeśli zaznaczone
  let wynik;
  if (timeout) {
    wynik = 0; 
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (newsletter === '1') ? 1 : 0; 
  }


  
  // 9. Odczytujemy maxCzas
  const maxCzas = req.session.maxCzas || 5;

  console.log('[POST /task4] Zapis do bazy:', {
    newsletter,
    wynik,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    timeout
  });


  if (!req.session.quizResults) req.session.quizResults = [];
  if (!req.session.quizResults.some(result => result.task === 'task4')) {
    req.session.quizResults.push({ task: 'task4', result: wynik });
  }

  // 10. Zapis do bazy (tabela 'questions' w tym przykładzie)
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
  db.query(sql, [
    req.session.sessionId,
    maxCzas,
    czasOdpowiedziRzeczywisty,
    wynik,
    timeout ? 1 : 0
  ], (err) => {
    if (err) {
      console.error('Błąd przy zapisie wyniku (task4):', err.message);
      return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
    }

    // 11. Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task4');

    // 12. Czyścimy dane
    delete req.session.visitedTask4Get;
    delete req.session.task4Token;
    delete req.session.maxCzas;
    delete req.session.taskStart;

    // 13. Po zapisie przekierowujemy np. do /intro_task5
    res.redirect('/intro_task5');
  });
});

module.exports = router;
