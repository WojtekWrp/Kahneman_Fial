const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /nudging3 – wyświetlenie zadania
router.get('/', (req, res) => {
  // 1. Ustawiamy flagę: user odwiedził GET /nudging3
  req.session.visitedNudging3Get = true;

  // 2. Zaczytujemy maxCzas z sesji
  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /nudging3] Odczytany maxCzas z sesji =', wylosowanyCzas, ' sessionID=', req.sessionID);

  // 3. Ustawiamy czas startu
  req.session.taskStart = Date.now();

  // 4. Generujemy unikalny token
  const nudging3Token = crypto.randomBytes(16).toString('hex');
  req.session.nudging3Token = nudging3Token;

  // 5. Renderujemy widok 'nudging3.ejs'
  //    W widoku użyj: <input type="hidden" name="nudging3Token" value="<%= nudging3Token %>" />
  res.render('nudging3', {
    wylosowanyCzas,
    nudging3Token,
    completedTasks: req.session.completedTasks || []
  });
});

// POST /nudging3 – obsługa formularza
router.post('/', (req, res) => {
  // 1. Sprawdź, czy użytkownik odwiedził GET
  if (!req.session.visitedNudging3Get) {
    console.log('[POST /nudging3] Nie odwiedził GET, przekierowanie na /nudging3');
    return res.redirect('/nudging3');
  }

  // 2. Pobierz token z formularza
  const { nudging3Token: bodyToken } = req.body;
  console.log("[POST /nudging3]", {
    bodyToken,
    sessionToken: req.session.nudging3Token,
    sessionID: req.sessionID
  });

  // 3. Walidacja tokenu
  if (bodyToken !== req.session.nudging3Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // 4. Ensure `completedTasks` as array
  req.session.completedTasks = req.session.completedTasks || [];

  // // 5. Sprawdź, czy zadanie już ukończone
  // if (req.session.completedTasks.includes('nudging3')) {
  //   return res.status(400).send('To zadanie zostało już ukończone.');
  // }

  // 6. Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();

  // 7. Oznaczamy zadanie jako ukończone
  req.session.completedTasks.push('nudging3');

  // 8. Czyścimy dane
  delete req.session.visitedNudging3Get;
  delete req.session.nudging3Token;
  delete req.session.maxCzas;
  delete req.session.taskStart;

  // 9. Przekierowanie do kolejnego zadania (np. /intro_task7)
  res.redirect('/intro_task7');
});

module.exports = router;
