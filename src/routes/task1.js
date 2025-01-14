const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task1
router.get('/', (req, res) => {

  // Ustawiamy w sesji timestamp (w milisekundach od epoki) jako moment startu
  req.session.taskStart = Date.now();


  const wylosowanyCzas = req.session.maxCzas || 5;
  console.log('[task1Router] GET, maxCzas =', wylosowanyCzas);
  res.render('task1', { wylosowanyCzas });
});





// POST /task1
router.post('/', (req, res) => {


  // Pobieramy znacznik timeout
  const timeout = req.body.timeout === 'true';  
  console.log("czy wysłany po timeoucie?", timeout);

  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
  // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
  const realStart = startTimestamp || 0;
  const now = Date.now();

  // Różnica w sekundach (lub milisekundach, zależnie co wolisz w bazie)
  const czasOdpowiedziRzeczywisty = (now - realStart) / 1000;  //sekundy
  const choice = req.body.choice;

  

  const maxCzas = req.session.maxCzas || 5;
  //const czasOdpowiedzi = Math.random() * maxCzas;
  const czasOdpowiedzi = czasOdpowiedziRzeczywisty;

   // Ustalanie wyniku na podstawie timeout
   let wynik;
   if (timeout) {
     wynik = 0; // zadanie niewykonane jeżeli timeout
     console.log('Zadanie zakończone przez timeout');
   } else {
     wynik = (choice === 'green') ? 0 : 1; // Normalne sprawdzenie wyboru
   }


   if (!req.session.quizResults) req.session.quizResults = [];
   if (!req.session.quizResults.some(result => result.task === 'task1')) {
       req.session.quizResults.push({ task: 'task1', result: wynik });
   }
   

  console.log('czas odpowiedni wyniosl ',czasOdpowiedzi );
  console.log('POST: wynik zadania to',wynik );
  // Zapis do bazy
  const sql = 'INSERT INTO kolory (id_sesji, max_czas, czas_odpowiedzi, wynik) VALUES (?, ?, ?, ?)';
  db.query(sql, [req.session.sessionId, maxCzas, czasOdpowiedzi, wynik], (err) => {
    if (err) {
      console.error('Błąd zapisu w Task1:', err.message);
      return res.status(500).send('Błąd zapisu');
    }
    // Przechodzimy do /intro_task2, np.
    res.redirect('/intro_task2');
  });
});

module.exports = router;