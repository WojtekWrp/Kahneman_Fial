const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych

// GET /task5 – wyświetlenie zadania
router.get('/', (req, res) => {
  // Ustawiamy moment startu na bieżący czas
  req.session.taskStart = Date.now();
  
  // Generowanie unikalnego tokenu
  const taskToken = crypto.randomBytes(16).toString('hex');
  req.session.taskToken = taskToken; // Zapisanie tokenu w sesji

  const wylosowanyCzas = req.session.maxCzas;
  console.log('[GET /task5] Odczytany maxCzas z sesji =', wylosowanyCzas);

  res.render('task5', {
    wylosowanyCzas,
    taskToken,
    completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku
    
  });

});

// POST /task5 – obsługa formularza dla Zadania 5
router.post('/', (req, res) => {

  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task5')) {
    return res.status(400).send('To zadanie zostało już ukończone.');
  }


   // Pobieramy znacznik timeout
   const timeout = req.body.timeout === 'true';  
   console.log("czy wysłany po timeoucie?", timeout);

  // Zaczytujemy moment startu z sesji
  const startTimestamp = req.session.taskStart;
  const now = Date.now();

  // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
  const realStart = startTimestamp || 0;
  const czasOdpowiedziRzeczywisty = (now - realStart) / 1000; // w sekundach

  //Jeżeli przyjdzie True, to do bazy leci 0.
  const  choice  = req.body.choice;
  const maxCzas = req.session.maxCzas || 5;
  let wynik;
  if (timeout) {
    wynik = 0; // zadanie niewykonane jeżeli timeout
    console.log('Zadanie zakończone przez timeout');
  } else {
    // W zależności od choice, ustalasz wynik:
    wynik = (choice == 'True') ? 0 : 1; // Normalne sprawdzenie wyboru
  
  }

  if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task5')) {
        req.session.quizResults.push({ task: 'task5', result: wynik });
    } 
  console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);



  

  console.log('[POST /task5]', {
    choice,
    maxCzas,
    czasOdpowiedzi: czasOdpowiedziRzeczywisty,
    wynik
  });

  const sql = `
    INSERT INTO preselections (id_sesji, max_czas, czas_odpowiedzi, wynik, timeout)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [req.session.sessionId, maxCzas, czasOdpowiedziRzeczywisty, wynik, timeout ? 1 : 0 ], (err) => {
      if (err) {
          console.error('Błąd przy zapisie wyniku dla zadania 5:', err.message);
          return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
      }
  
  // Oznaczenie zadania jako ukończone
  req.session.completedTasks.push('task5');
  delete req.session.maxCzas; // <--- czyścimy czas, by nie był używany w kolejnych zadaniach
  delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu    
  res.redirect('/intro_task6');
  });
});

module.exports = router;
