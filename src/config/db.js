const mysql = require('mysql2');

// Tworzenie puli połączeń
const pool = mysql.createPool({
    host: 'kahneman-wojtek-16f5.g.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_34h6TpaM6F3gmgfI8D1',
    database: 'defaultdb',
    port: 10947,
    timezone: 'Europe/Warsaw',
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0
});

// Eksportuj promisyfikowaną wersję (dla lepszego kodu async/await)
const db = pool.promise();

module.exports = db;