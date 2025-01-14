const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./config/db'); // db z /src/config
const path = require('path');

const task1Routes = require('./routes/task1'); 
const task2Routes = require('./routes/task2'); 
const task3Routes = require('./routes/task3');
const task4Routes = require('./routes/task4');
const task5Routes = require('./routes/task5');
const task6Routes = require('./routes/task6');
const task7Routes = require('./routes/task7');
const task8Routes = require('./routes/task8');

const introTask1Router = require('./routes/intro_task1');
const introTask2Router = require('./routes/intro_task2');
const introTask3Router = require('./routes/intro_task3');
const introTask4Router = require('./routes/intro_task4');
const introTask5Router = require('./routes/intro_task5');
const introTask6Router = require('./routes/intro_task6');
const introTask7Router = require('./routes/intro_task7');
const introTask8Router = require('./routes/intro_task8');

const outroRouter = require('./routes/outro');

const app = express();
const PORT = 5000;


// Konfiguracja body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Ustawienie EJS jako silnika szablonów
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '..', 'views')); //ścieżka do widoków



// Konfiguracja sesji
app.use(session({
    secret: 'tajny_klucz',
    resave: false,
    saveUninitialized: false
}));

// Middleware do sprawdzania sesji
function checkSession(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/register');
    }
    next();
}



function getRandomTime() {
    const mozliweCzasy = [5, 30];
    return mozliweCzasy[Math.floor(Math.random() * mozliweCzasy.length)];
  }


// Middleware do sprawdzania postępu użytkownika
function checkTaskProgress(req, res, next) {
    const currentPath = req.path; // np. /task2
    const sessionId = req.session.sessionId;

    console.log('Sprawdzam postęp użytkownika...');
    console.log('Aktualna ścieżka:', currentPath);
    console.log('sessionId:', sessionId);

    if (!sessionId) {
        console.error('Brak sessionId – przekierowanie do rejestracji.');
        return res.redirect('/register');
    }
    

    let sql;
    if (currentPath === '/task2') {
        sql = 'SELECT COUNT(*) AS completed FROM kolory WHERE id_sesji = ?';
        console.log('Sprawdzam postęp dla zadania 1 (tabela kolory).');
    } else if (currentPath === '/task3') {
        sql = 'SELECT COUNT(*) AS completed FROM false_hierarchy WHERE id_sesji = ?';
        console.log('Sprawdzam postęp dla zadania 2 (tabela false_hierarchy).');
    } else {
        console.log('Brak wymogu weryfikacji dla tej ścieżki.');
        return next();
    }


    console.log('Wykonuję zapytanie SQL:', sql);
    console.log('Używając sessionId:', sessionId);
    db.query(sql, [sessionId], (err, result) => {
        if (err) {
            console.error('Błąd SQL:', err.message);
            return res.status(500).send('Wystąpił błąd.');
        }
        console.log('Wynik zapytania:', result);
    });
    

    db.query(sql, [sessionId], (err, result) => {
        if (err) {
            console.error('Błąd przy sprawdzaniu postępu:', err.message);
            return res.status(500).send('Wystąpił błąd przy sprawdzaniu postępu.');
        }

        console.log('Wynik zapytania SQL:', result);

        const isCompleted = result[0].completed > 0;
        console.log('Czy zadanie zostało ukończone?', isCompleted);

        if (!isCompleted) {
            console.warn('Poprzednie zadanie nie zostało ukończone – przekierowanie do /register.');
            return res.redirect('/register');
        }

        console.log('Poprzednie zadanie ukończone – kontynuuję.');
        next();
    });
}










// Statyczne pliki (np. style.css, script.js)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Strona główna
app.get('/', (req, res) => {
    res.send('<h1>Witaj w aplikacji Kahneman!</h1><p><a href="/register">Rejestracja</a></p>');
});

// Rejestracja
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

app.post('/register', (req, res) => {
    const { wiek, plec, wyksztalcenie, uczelnia, rodzaj_wyksztalcenia } = req.body;

    const sql = `
        INSERT INTO uzytkownicy (wiek, plec, id_wyksztalcenia, uczelnia, id_rodzaju_wyksztalcenia)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [wiek, plec, wyksztalcenie, uczelnia, rodzaj_wyksztalcenia], (err, result) => {
        if (err) {
            console.error('Błąd przy rejestracji:', err.message);
            return res.status(500).send('Wystąpił błąd podczas rejestracji.');
        }

        console.log("studia", rodzaj_wyksztalcenia);
        const userId = result.insertId;
        const startTime = new Date();
        const sessionSql = 'INSERT INTO sesja (id_uzytkownika, rozp_sesji) VALUES (?, ?)';
        db.query(sessionSql, [userId, startTime], (err, sessionResult) => {
            if (err) {
                console.error('Błąd przy tworzeniu sesji:', err.message);
                return res.status(500).send('Wystąpił błąd przy tworzeniu sesji.');
            }

            req.session.userId = userId;
            req.session.sessionId = sessionResult.insertId;
            res.redirect('/intro_task1');
        });
    });
});










// Jeśli użytkownik wchodzi na /intro_task1, 
// losujemy nowy czas i zapisujemy do sesji, po czym przekazujemy dalej do routera.
app.use('/intro_task1', (req, res, next) => {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task1, wylosowany =', nowyCzas);
    next();
  }, introTask1Router);
  
app.use('/task1', checkSession, checkTaskProgress, task1Routes);





// Intro Task2
app.use('/intro_task2', (req, res, next) => {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task2, wylosowany =', nowyCzas);
    next();
  }, introTask2Router);
  
// Task2
app.use('/task2', checkSession, checkTaskProgress, task2Routes);





// Intro Task3
app.use('/intro_task3', (req, res, next) => {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task3, wylosowany =', nowyCzas);
    next();
  }, introTask3Router);

// Task3
app.use('/task3', checkSession, checkTaskProgress, task3Routes);





// Intro do Task4
app.use('/intro_task4', (req, res, next) => {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task4, wylosowany =', nowyCzas);
    next();
  }, introTask4Router);

//zadanie4
app.use('/task4', checkSession, checkTaskProgress, task4Routes);




// Intro do Task5
//PRESELECTIONS
app.use('/intro_task5', (req, res, next) => {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task5, wylosowany =', nowyCzas);
    next();
  }, introTask5Router);

//zadanie5
app.use('/task5', checkSession, checkTaskProgress, task5Routes);




// Intro do Task6
//TIMEPRESSING
//na stałe 30sek w zadaniu
app.use('/intro_task6', (req, res, next) => {
    const nowyCzas = 30;
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task6, wylosowany =', nowyCzas);
    next();
  }, introTask6Router);
//zadanie6
app.use('/task6', checkSession, checkTaskProgress, task6Routes);


// Intro do Task7
//FRAMING
//na stałe 30sek w zadaniu
app.use('/intro_task7', (req, res, next) => {
    const nowyCzas = 30;
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task7, wylosowany =', nowyCzas);
    next();
  }, introTask7Router);
//zadanie7
  app.use('/task7', checkSession, checkTaskProgress, task7Routes);
  



// Intro do Task8
//Socialproof
//na stałe 30sek
app.use('/intro_task8', (req, res, next) => {
    const nowyCzas = 30;
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task8, wylosowany =', nowyCzas);
    next();
  }, introTask8Router);
//zadanie8
app.use('/task8', checkSession, checkTaskProgress, task8Routes);




//Outro- koniec
app.use('/outro', checkSession, checkTaskProgress, outroRouter);
  



// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
