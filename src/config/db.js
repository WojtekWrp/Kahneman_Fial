const mysql = require('mysql2');

// Konfiguracja połączenia z LOKALNĄ bazą danych
const db = mysql.createConnection({
    host: 'kahneman-wojtek-16f5.g.aivencloud.com', 
    user: 'avnadmin',       // Użytkownik bazy danych
    password: 'AVNS_34h6TpaM6F3gmgfI8D1',       // Hasło bazy danych
    database: 'defaultdb' ,// Nazwa bazy danych
    port: 10947 ,
    timezone: 'Europe/Warsaw' // Dodaj strefę czasową
});

// Nawiązanie połączenia
db.connect(err => {
    if (err) {
        console.error('Błąd połączenia z lokalną bazą danych:', err.message);
        throw err;
    }
    console.log('Połączono z bazą danych MySQL');
});

module.exports = db;
