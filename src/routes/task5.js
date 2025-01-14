const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych

// GET /task5 – wyświetlenie zadania
router.get('/', (req, res) => {
  // Ustawiamy moment startu na bieżący czas
  req.session.taskStart = Date.now();

  const wylosowanyCzas = req.session.maxCzas || 5;
  console.log('[GET /task5] Odczytany maxCzas z sesji =', wylosowanyCzas);

  res.render('task5', { wylosowanyCzas });
});

// POST /task5 – obsługa formularza dla Zadania 5
router.post('/', (req, res) => {


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
    INSERT INTO preselections (id_sesji, max_czas, czas_odpowiedzi, wynik)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [req.session.sessionId, maxCzas, czasOdpowiedziRzeczywisty, wynik], (err) => {
      if (err) {
          console.error('Błąd przy zapisie wyniku dla zadania 5:', err.message);
          return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
      }
      res.redirect('/intro_task6');
  });
});

module.exports = router;
