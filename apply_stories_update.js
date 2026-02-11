const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

const sql = fs.readFileSync(path.join(__dirname, 'update_stories.sql'), 'utf8');

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to database.');
    
    connection.query(sql, (err, result) => {
        if (err) throw err;
        console.log('Stories table created successfully.');
        connection.end();
    });
});
