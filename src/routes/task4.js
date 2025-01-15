const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import konfiguracji bazy danych

// GET /task4 – wyświetlenie zadania
router.get('/', (req, res) => {

    req.session.taskStart = Date.now();
    // Odczytujemy wylosowany czas z sesji (ustawiony wcześniej w app.js lub /intro_task4)
    const wylosowanyCzas = req.session.maxCzas || 5; 
    const taskToken = crypto.randomBytes(16).toString('hex');
    req.session.taskToken = taskToken; // // Zapisanie tokenu w sesji

    console.log('[GET /task4] Odczytano maxCzas z sesji =', wylosowanyCzas);

   
   
   
    // Renderujemy widok 'task4.ejs' z wartością wylosowanyCzas
    res.render('task4', {
    wylosowanyCzas,
    taskToken,
    completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku
  });

});

// POST /task4 – zapis wyniku
router.post('/', (req, res) => {



    const { taskToken } = req.body; 
    // Walidacja tokenu
    if (taskToken !== req.session.taskToken) {
      return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
    }
  
    // Ensure `completedTasks` exists as an array
    req.session.completedTasks = req.session.completedTasks || [];
  
    // Sprawdzenie, czy zadanie zostało ukończone
    if (req.session.completedTasks.includes('task4')) {
      return res.status(400).send('To zadanie zostało już ukończone.');
    }


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
    const czasOdpowiedzi = czasOdpowiedziRzeczywisty;

    // Pobieramy wartość z formularza (checkbox).
    // Jeśli user nie zaznaczył, w ogóle nie pojawi się w req.body (lub będzie pusty).
    const newsletter = req.body.newsletter;
    
    // Zależnie od wartości newsletter, ustawiamy wynik = 1 (zaznaczony) albo 0 (niezaznaczony).
    let wynik;
    if (timeout) {
      wynik = 0; // zadanie niewykonane jeżeli timeout
      console.log('Zadanie zakończone przez timeout');
    } else {
        wynik = (newsletter === '1') ? 1 : 0; // Normalne sprawdzenie wyboru
    }

    if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task4')) {
        req.session.quizResults.push({ task: 'task4', result: wynik });
    }
    console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);



    // Odczytujemy wylosowany maxCzas z sesji
    const maxCzas = req.session.maxCzas || 5;
    // Symulacja czasu odpowiedzi
    

    console.log("[POST /task4]");
    console.log("newsletter (checkbox):", newsletter);
    console.log("wynik w bazie:", wynik);
    console.log("maxCzas z sesji:", maxCzas);
    console.log("czasOdpowiedzi (symulacja):", czasOdpowiedzi);

    // Zapis do bazy (tabela 'questions' lub 'task4', dostosuj nazwę kolumn)
    const sql = `
        INSERT INTO questions (id_sesji, max_czas, czas_odpowiedzi, wynik)
        VALUES (?, ?, ?, ?)
    `;
    console.log('czas odpowiedni wyniosl ',czasOdpowiedzi );
    db.query(sql, [req.session.sessionId, maxCzas, czasOdpowiedzi, wynik], (err) => {
        if (err) {
            console.error('Błąd przy zapisie wyniku (task4):', err.message);
            return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
        }

     // Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task4');
    delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu
    // Po zapisie przekierowujemy np. do intro_task5
    res.redirect('/intro_task5');
    });
});

module.exports = router;
