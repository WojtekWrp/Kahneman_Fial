const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');


// GET /task1
router.get('/', (req, res) => {
  // Ustawiamy w sesji timestamp (w milisekundach od epoki) jako moment startu
  req.session.taskStart = Date.now();
  const wylosowanyCzas = req.session.maxCzas;

  // Generowanie unikalnego tokenu
  const taskToken = crypto.randomBytes(16).toString('hex');
  req.session.taskToken = taskToken; // Zapisanie tokenu w sesji

  console.log('[task1Router] GET, maxCzas =', wylosowanyCzas, 'wygenerowany token: ', taskToken);

  res.render('task1', {
    wylosowanyCzas,
    taskToken,
    completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku
  });
});


// POST /task1
router.post('/', (req, res) => {

  
  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task1')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }



  // Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';
  console.log("czy wysłany po timeoucie?", timeout);

  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
  const realStart = startTimestamp || 0;
  const now = Date.now();

  const czasOdpowiedziRzeczywisty = (now - realStart) / 1000; // sekundy
  const choice = req.body.choice;

  const maxCzas = req.session.maxCzas
  const czasOdpowiedzi = czasOdpowiedziRzeczywisty;

  // Ustalanie wyniku na podstawie timeout
  let wynik;
  if (timeout) {
    wynik = 0; // zadanie niewykonane jeżeli timeout
    console.log('Zadanie zakończone przez timeout');
  } else {
    wynik = (choice === 'green') ? 0 : 1; // Normalne sprawdzenie wyboru
  }

  console.log('czas odpowiedni wyniosl ', czasOdpowiedzi);
  console.log('POST: wynik zadania to', wynik);

  // Zapis do bazy
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
    czasOdpowiedzi, 
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
    delete req.session.maxCzas;
    delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu
    res.redirect('/intro_task2');
  });

});

module.exports = router;