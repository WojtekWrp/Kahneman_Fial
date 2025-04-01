const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /nudging2 – wyświetlenie zadania
router.get('/', (req, res) => {
  // 1. Zaznaczamy, że odwiedziliśmy GET /nudging2
  req.session.visitedNudging2Get = true;

  // 2. Odczytujemy maxCzas i ustawiamy start zadania
  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /nudging2]', {
    wylosowanyCzas,
    sessionID: req.sessionID
  });
  req.session.taskStart = Date.now();

  // 3. Generujemy unikalny token dla nudging2
  const nudging2Token = crypto.randomBytes(16).toString('hex');
  req.session.nudging2Token = nudging2Token;

  // 4. Renderujemy widok nudging2.ejs
  res.render('nudging2', {
    wylosowanyCzas,
    nudging2Token, 
    completedTasks: req.session.completedTasks || []
  });
});

// POST /nudging2 – obsługa formularza
router.post('/', (req, res) => {
  // 1. Sprawdź, czy użytkownik odwiedził GET /nudging2
  if (!req.session.visitedNudging2Get) {
    console.log('[POST /nudging2] Ominięto GET, redirect do /nudging2');
    return res.redirect('/nudging2');
  }

  // 2. Pobierz token z formularza
  const { nudging2Token: bodyToken } = req.body;
  console.log("[POST /nudging2] bodyToken:", bodyToken, "sessionToken:", req.session.nudging2Token, "sessionID:", req.sessionID);

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.nudging2Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // 4. Upewnij się, że mamy tablicę completedTasks
  req.session.completedTasks = req.session.completedTasks || [];

  // 5. Sprawdź, czy zadanie nie zostało już ukończone
  if (req.session.completedTasks.includes('nudging2')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 6. Odczytujemy moment startu
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();

  // 7. Dodajemy 'nudging2' do completedTasks
  req.session.completedTasks.push('nudging2');

  // 8. (Opcjonalnie) jakieś logi do bazy – tu niby nie ma, 
  //    więc pomijamy. Gdybyś chciał, możesz analogicznie zapisać, 
  //    jak w poprzednich zadaniach.

  // 9. Czyścimy dane z sesji
  delete req.session.visitedNudging2Get;
  delete req.session.nudging2Token;
  delete req.session.maxCzas;
  delete req.session.taskStart;

  // 10. Przekierowanie do intro kolejnego zadania (np. /intro_task3)
  res.redirect('/intro_task3');
});

module.exports = router;
