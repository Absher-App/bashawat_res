const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    const sql = "ALTER TABLE products ADD COLUMN details TEXT DEFAULT NULL;";
    connection.query(sql, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column details already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column details added successfully.');
        }
        connection.end();
    });
});
