const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych

// GET /task3 – wyświetlenie zadania
router.get('/', (req, res) => {
    // Odczytujemy wylosowany czas z sesji (ustawiony w app.js lub w /intro_task3)
    const wylosowanyCzas = req.session.maxCzas || 5;

    console.log('[GET /task3] Odczytany maxCzas z sesji =', wylosowanyCzas);
    req.session.taskStart = Date.now();
    // Renderujemy widok 'task3.ejs' i przekazujemy wylosowanyCzas
    res.render('task3', { wylosowanyCzas });
});

// POST /task3 – obsługa formularza zadania 3
router.post('/', (req, res) => {
  const timeout = req.body.timeout === 'true';
  // Zaczytujemy moment startu
  const startTimestamp = req.session.taskStart;
   // Jeśli z jakiegoś powodu jest undefined, wstawiamy 0
   const realStart = startTimestamp || 0;
   const now = Date.now();
 // Różnica w sekundach (lub milisekundach, zależnie co wolisz w bazie)
 const czasOdpowiedziRzeczywisty = (now - realStart) / 1000;  //sekundy
 const czasOdpowiedzi = czasOdpowiedziRzeczywisty;

    
    // Pobieramy wybór użytkownika
    const { choice } = req.body;

    // Odczytujemy maksymalny czas (wylosowany wcześniej i zapisany w sesji)
    const maxCzas = req.session.maxCzas || 5;
    // Symulacja czasu odpowiedzi (losujemy od 0 do maxCzas)
    
    console.log("czy wysłany po timeoucie?", timeout);
    // Interpretacja: jeśli choice === 'without_insurance', wynik = 1, inaczej 0
    let wynik;
   if (timeout) {
     wynik = 0; // zadanie niewykonane jeżeli timeout
     console.log('Zadanie zakończone przez timeout');
   } else {
    wynik = (choice === 'without_insurance') ? 1 : 0; // Normalne sprawdzenie wyboru
   }

   if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task3')) {
        req.session.quizResults.push({ task: 'task3', result: wynik });
    }

    console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);
    console.log('[POST /task3]', {
      choice,
      maxCzas,
      czasOdpowiedzi,
      wynik
    });

    // Dodajemy wynik do tabeli 'misdirections'
    const sql = `
      INSERT INTO misdirections (id_sesji, max_czas, czas_odpowiedzi, wynik)
      VALUES (?, ?, ?, ?)
    `;
    console.log('czas odpowiedni wyniosl ',czasOdpowiedzi );
    db.query(sql, [req.session.sessionId, maxCzas, czasOdpowiedzi, wynik], (err) => {
        if (err) {
            console.error('Błąd przy zapisie wyniku dla zadania 3:', err.message);
            return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
        }

        // Przekierowanie do kolejnego intro (np. /intro_task4)
        res.redirect('/intro_task4');
    });
});

module.exports = router;
