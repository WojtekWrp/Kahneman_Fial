const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// GET /nudging1 – wyświetlenie zadania
router.get('/', (req, res) => {
  // Ustawiamy flagę informującą, że odwiedziliśmy GET /nudging1
  req.session.visitedNudging1Get = true;

  // Odczytujemy maxCzas z sesji
  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /nudging1]', {
    wylosowanyCzas,
    sessionID: req.sessionID,
  });

  // Ustawiamy znacznik startu zadania
  req.session.taskStart = Date.now();

  // Generujemy token unikalny dla nudging1
  const nudging1Token = crypto.randomBytes(16).toString('hex');
  req.session.nudging1Token = nudging1Token;

  // Renderujemy widok
  res.render('nudging1', {
    wylosowanyCzas,
    nudging1Token, // <= to wstawisz w <input type="hidden" name="nudging1Token" ...>
    completedTasks: req.session.completedTasks || []
  });
});

// POST /nudging1 – obsługa formularza
router.post('/', (req, res) => {

 

  // 1. Sprawdzamy, czy odwiedzono GET
  if (!req.session.visitedNudging1Get) {
    console.log('[POST /nudging1] Użytkownik nie przeszedł przez GET /nudging1');
    return res.redirect('/nudging1'); 
  }

  // 2. Sprawdzamy token
  const { nudging1Token: bodyToken } = req.body; // w EJS <input type="hidden" name="nudging1Token" ...>
  console.log("[POST /nudging1] bodyToken:", bodyToken, "sessionToken:", req.session.nudging1Token, "sessionID:", req.sessionID);

  if (bodyToken !== req.session.nudging1Token) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // 3. Ensure completedTasks jest tablicą
  req.session.completedTasks = req.session.completedTasks || [];

  // 4. Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('nudging1')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }

  // 5. Znacznik startu i czas odpowiedzi
  const startTimestamp = req.session.taskStart || 0;
  const now = Date.now();
  const czasOdpowiedziRzeczywisty = (now - startTimestamp) / 1000;

  console.log("[POST /nudging1] Zakończenie zadania, czas:", czasOdpowiedziRzeczywisty);

  // 6. Oznaczenie zadania jako ukończone
  req.session.completedTasks.push('nudging1');

  // 7. Czyścimy dane z sesji
  delete req.session.visitedNudging1Get;
  delete req.session.nudging1Token;
  delete req.session.maxCzas; 
  delete req.session.taskStart; 

  // 8. Przekierowanie do intro_task1
  res.redirect('/intro_task1'); 
});

module.exports = router;
