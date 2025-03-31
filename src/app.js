const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./config/db'); // db z /src/config
const path = require('path');
const rateLimit = require('express-rate-limit');
const registerRoutes = require('./routes/register');

const introNudging1Router = require('./routes/intro_nudging1');
const introNudging2Router = require('./routes/intro_nudging2');
const introNudging3Router = require('./routes/intro_nudging3')
const introTask1Router = require('./routes/intro_task1');
const introTask2Router = require('./routes/intro_task2');
const introTask3Router = require('./routes/intro_task3');
const introTask4Router = require('./routes/intro_task4');
const introTask5Router = require('./routes/intro_task5');
const introTask6Router = require('./routes/intro_task6');
const introTask7Router = require('./routes/intro_task7');
const introTask8Router = require('./routes/intro_task8');

const nudging1Routes = require('./routes/nudging1');
const nudging2Routes = require('./routes/nudging2');
const nudging3Routes = require('./routes/nudging3');
const task1Routes = require('./routes/task1'); 
const task2Routes = require('./routes/task2'); 
const task3Routes = require('./routes/task3');
const task4Routes = require('./routes/task4');
const task5Routes = require('./routes/task5');
const task6Routes = require('./routes/task6');
const task7Routes = require('./routes/task7');
const task8Routes = require('./routes/task8');


const feedbackRoutes = require('./routes/feedback');
const outroRouter = require('./routes/outro');

const app = express();
const PORT = 5000;


// Konfiguracja body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware do zapobiegania cache'owaniu
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '-1');
    next();
  });

// Ustawienie EJS jako silnika szablonów
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views')); //ścieżka do widoków

// Konfiguracja sesji
app.use(session({
  secret: process.env.SESSION_SECRET || 'bardzo_tajny_klucz',
  resave: false,
  saveUninitialized: false,
  cookie: {
      httpOnly: true, // Zapobiega atakom XSS
      secure: process.env.NODE_ENV === 'production', // Wymaga HTTPS w produkcji
      sameSite: 'strict' // Chroni przed CSRF
  }
}));



function getRandomTime() {
    const mozliweCzasy = [5, 30];
    return mozliweCzasy[Math.floor(Math.random() * mozliweCzasy.length)];
  }



// Statyczne pliki (np. style.css, script.js)
app.use(express.static(path.join(__dirname, '..', 'public')));


// Strona główna
app.get('/', (req, res) => {
  res.redirect('/register'); // Przekierowanie do strony rejestracji
});
app.use('/register', registerRoutes);



app.use('/intro_nudging1', (req, res, next) => {
  if (!req.session.maxCzas) {
      const nowyCzas = getRandomTime();
      req.session.maxCzas = nowyCzas;
      console.log('[app.js] Wchodzę na /intro_nudging1, WYLLOSOWANY =', nowyCzas);
  } else {
      console.log('[app.js] Wchodzę na /intro_nudging1, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
  next();
}, introNudging1Router);


app.use('/nudging1', checkSession, nudging1Routes);




// Jeśli użytkownik wchodzi na /intro_task1, 
// losujemy nowy czas i zapisujemy do sesji, po czym przekazujemy dalej do routera.
app.use('/intro_task1', (req, res, next) => {
  if (!req.session.maxCzas) {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task1, WYLOSOWANY =', nowyCzas);
  } else {
    console.log('[app.js] Wchodzę na /intro_task1, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
    next();
  }, introTask1Router);

//app.use('/task1', checkSession, checkTaskProgress, task1Routes);
app.use('/task1', checkSession, task1Routes);



// Intro Task2
app.use('/intro_task2', (req, res, next) => {
  if (!req.session.maxCzas) {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task2, WYLOSOWANY =', nowyCzas);
  } else {
    console.log('[app.js] Wchodzę na /intro_task2, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
  next()
  }, introTask2Router);
 
//app.use('/task2', checkSession, checkTaskProgress, task2Routes);
app.use('/task2', checkSession, task2Routes);



app.use('/intro_nudging2', (req, res, next) => {
  // Losujemy TYLKO jeśli jeszcze nie mamy maxCzas
  if (!req.session.maxCzas) {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_nudging2, WYLOSOWANY =', nowyCzas);
  } else {
    console.log('[app.js] Wchodzę na /intro_nudging2, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
  next();
}, introNudging2Router);

app.use('/nudging2', checkSession, nudging2Routes);




// Intro Task3
app.use('/intro_task3', (req, res, next) => {
  if (!req.session.maxCzas) {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task3, WYLOSOWANY =', nowyCzas);
  } else {
    console.log('[app.js] Wchodzę na /intro_task3, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
    next();
  }, introTask3Router);

// Task3;
app.use('/task3', checkSession,  task3Routes);







// Intro do Task4
app.use('/intro_task4', (req, res, next) => {
  if (!req.session.maxCzas) {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task4, WYLOSOWANY =', nowyCzas);
  } else {
    console.log('[app.js] Wchodzę na /intro_task4, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
    next();
  }, introTask4Router);
//zadanie4
app.use('/task4',task4Routes);





// Intro do Task5
//PRESELECTIONS
app.use('/intro_task5', (req, res, next) => {
  if (!req.session.maxCzas) {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task5, WYLOSOWANY =', nowyCzas);
  } else {
    console.log('[app.js] Wchodzę na /intro_task5, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
    next();
  }, introTask5Router);
app.use('/task5', checkSession,  task5Routes);





// Intro do Task6
//TIMEPRESSING
//na stałe 30sek w zadaniu
app.use('/intro_task6', (req, res, next) => {
    const nowyCzas = 30;
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task6, wylosowany =', nowyCzas);
    next();
  }, introTask6Router);
app.use('/task6', checkSession, task6Routes)




app.use('/intro_nudging3', (req, res, next) => {
  if (!req.session.maxCzas) {
    const nowyCzas = getRandomTime();
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_nudging3, WYLOSOWANY =', nowyCzas);
  } else {
    console.log('[app.js] Wchodzę na /intro_nudging3, UŻYWAM ISTNIEJĄCEGO =', req.session.maxCzas);
  }
  next();
}, introNudging3Router);
app.use('/nudging3', checkSession, nudging3Routes);



// Intro do Task7
//FRAMING
//na stałe 30sek w zadaniu
app.use('/intro_task7', (req, res, next) => {
    const nowyCzas = 30;
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task7, wylosowany =', nowyCzas);
    next();
  }, introTask7Router);
app.use('/task7', checkSession, task7Routes);



// Intro do Task8
//Socialproof
//na stałe 30sek
app.use('/intro_task8', (req, res, next) => {
    const nowyCzas = 30;
    req.session.maxCzas = nowyCzas;
    console.log('[app.js] Wchodzę na /intro_task8, wylosowany =', nowyCzas);
    next();
  }, introTask8Router);
app.use('/task8', checkSession, task8Routes);



app.use('/feedback', checkSession, feedbackRoutes);


//Outro- koniec
//app.use('/outro', checkSession, checkTaskProgress, outroRouter);
app.use('/outro', checkSession, outroRouter);

// Uruchomienie serwera
const HOST = '::'; // IPv6 oraz IPv4

app.listen(PORT, HOST, () => {
  console.log(`Serwer działa na http://[${HOST}]:${PORT}`);
});