const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Connected as id ' + connection.threadId);

    const sqlPath = path.join(__dirname, 'update_db_v2.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing SQL:', err);
        } else {
            console.log('Database updated successfully.');
        }
        connection.end();
    });
});
