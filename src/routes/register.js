const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Ścieżka do pliku konfiguracji bazy danych


// GET /register - Wyświetlenie formularza rejestracji
router.get('/', (req, res) => {
  // Czyszczenie sesji przed rozpoczęciem rejestracji
  req.session.destroy((err) => {
    if (err) {
      console.error('Błąd przy niszczeniu sesji:', err);
    }
    // Renderowanie widoku EJS (views/register.ejs)
    res.render('register');
  });
});
router.post('/', async (req, res) => {
  const { wiek, plec, wyksztalcenie, uczelnia, rodzaj_wyksztalcenia, rodzaj_zawodu } = req.body;

  const sql = `
    INSERT INTO uzytkownicy (wiek, plec, id_wyksztalcenia, uczelnia, id_rodzaju_wyksztalcenia, id_zawodu)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(sql, [wiek, plec, wyksztalcenie, uczelnia, rodzaj_wyksztalcenia, rodzaj_zawodu]);

    console.log('Rejestracja zakończona, dane użytkownika zapisane.');
    const userId = result.insertId;
    const startTime = new Date();

    const sessionSql = 'INSERT INTO sesja (id_uzytkownika, rozp_sesji) VALUES (?, ?)';
    const [sessionResult] = await db.query(sessionSql, [userId, startTime]);

    req.session.userId = userId;
    req.session.sessionId = sessionResult.insertId;

    res.redirect('/gdms');
  } catch (err) {
    console.error('Błąd przy rejestracji lub tworzeniu sesji:', err);
    res.status(500).send('Wystąpił błąd podczas rejestracji.'); 
  }
});
      
module.exports = router;
