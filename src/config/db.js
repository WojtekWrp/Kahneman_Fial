const mysql = require('mysql2');

// Konfiguracja połączenia z LOKALNĄ bazą danych
const db = mysql.createConnection({
    host: 'localhost',          // lokalny serwer MySQL
    user: 'advadmin',        // utworzony wcześniej użytkownik
    password: 'AVNS_34h6TpaM6F3gmgfI8D1',    // hasło lokalnego użytkownika
    database: 'defaultdb',     // nazwa zaimportowanej lokalnej bazy danych
    port: 3306,                 // domyślny port MySQL lokalnie
    timezone: '+01:00'          // poprawny offset czasowy (CET, czas zimowy)
});

// Nawiązanie połączenia
db.connect(err => {
    if (err) {
        console.error('Błąd połączenia z lokalną bazą danych:', err.message);
        throw err;
    }
    console.log('✅ Połączono z LOKALNĄ bazą danych MySQL');
});

module.exports = db;
