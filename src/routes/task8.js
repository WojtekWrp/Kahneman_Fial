// routes/task8.js
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /task8 – wyświetlenie zadania (czas zawsze 30s)
router.get('/', (req, res) => {


  

    // Ustawiamy stałe 30s w tym zadaniu
    const maxCzas = 30;
    const now = Date.now();
    // Określamy, czy to wersja "tricked" czy "normal"
    // Możesz ustawić na stałe np. true, albo wylosować:
    // const isTricked = Math.random() < 0.5;


    // TO DO ZMIENIC PO TESTACH
    const isTricked = true; 

    // Zapisujemy w sesji, by ewentualnie wykorzystać w routerze
    req.session.maxCzas = maxCzas;
    req.session.isTricked = isTricked;

     // Generowanie unikalnego tokenu
      const taskToken = crypto.randomBytes(16).toString('hex');
      req.session.taskToken = taskToken; // Zapisanie tokenu w sesji 


    // Zapisujemy moment startu (rzeczywistego wejścia na /task6)
    req.session.taskStart = Date.now();

    console.log('[GET /task8]', {
      isTricked,
      maxCzas,
      taskStart: req.session.taskStart
    });




    // Renderujemy widok task8.ejs, przekazujemy isTricked i maxCzas
    res.render('task8', {
      isTricked,
      maxCzas,
      taskToken,
      completedTasks: req.session.completedTasks || [] // Przekazywanie completedTasks do widoku
    });




});

// POST /task8 – zapis wyniku w tabeli `socialproof`
router.post('/', (req, res) => {


  const { taskToken } = req.body; 
  // Walidacja tokenu
  if (taskToken !== req.session.taskToken) {
    return res.status(403).send('Nieprawidłowy token. Dostęp zabroniony.');
  }

  // Ensure `completedTasks` exists as an array
  req.session.completedTasks = req.session.completedTasks || [];

  // Sprawdzenie, czy zadanie zostało ukończone
  if (req.session.completedTasks.includes('task8')) {
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




    // Odczytujemy z sesji dane
    const isTricked = req.session.isTricked || false;
    const wersja = isTricked ? 'tricked' : 'normal';

    // Rzeczywisty czas od wejścia (GET) do kliknięcia (POST)
    
    const czasOdKlikniecia = (Date.now() - startTimestamp) / 1000; // sekundy

    //Jeżeli użytkownik zaznaczył śniadanie (true)-> Do bazy leci 0, dał się oszukać
    const koszulka = req.body.koszulka; // '5' jeśli zaznaczył, undefined jeśli nie
    let wynik;
    if (timeout) {
      wynik = 0; // zadanie niewykonane jeżeli timeout
      console.log('Zadanie zakończone przez timeout');
    } else {
      wynik = (koszulka === 'True') ? 0 : 1;// Normalne sprawdzenie wyboru'
      console.log('wynik z else', wynik);
    }

    if (!req.session.quizResults) req.session.quizResults = [];
    if (!req.session.quizResults.some(result => result.task === 'task8')) {
        req.session.quizResults.push({ task: 'task8', result: wynik });
    }
    console.log('Wyniki quizu z tablicy sesji', req.session.quizResults);

    console.log('[POST /task8', {
      wersja,
      czasOdKlikniecia,
      wynik
    });


        const updateSessionSql = ` 
        UPDATE sesja
        SET koniec_sesji = CURRENT_TIMESTAMP
        WHERE id_sesji = ?
    `;//zakonczenie sesji

    // Zapis do tabeli timepressing
    // Kolumny: id_sesji, wersja (enum('tricked','normal')), czas_odpowiedzi, wynik
    const sql = `
      INSERT INTO socialproof (id_sesji, wersja, czas_odpowiedzi, wynik)
      VALUES (?, ?, ?, ?)
    `;
      db.query(updateSessionSql, [req.session.sessionId], (err) => {
      if (err) {
          console.error('Błąd przy aktualizacji koniec_sesji:', err.message);
          return res.status(500).send('Wystąpił błąd podczas aktualizacji czasu zakończenia sesji.');
      }
  
      // Kontynuuj, jeśli aktualizacja się powiedzie
      console.log('Czas zakończenia sesji został zaktualizowany.');
  });
    db.query(sql, [
      req.session.sessionId, // id_sesji
      wersja,                // 'tricked' lub 'normal'
      czasOdKlikniecia,      // float
      wynik                  // 1 lub 0
    ], (err) => {
        if (err) {
            console.error('Błąd przy zapisie do timepressing:', err.message);
            return res.status(500).send('Wystąpił błąd podczas zapisywania wyniku.');
        }



     // Oznaczenie zadania jako ukończone
    req.session.completedTasks.push('task8');
    delete req.session.taskToken; // Usunięcie tokenu po wykorzystaniu

    // Po zapisie przekierowujemy np. do /intro_task7
    res.redirect('/feedback');
    });
});

module.exports = router;
