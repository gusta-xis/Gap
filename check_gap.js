require('dotenv').config();
const db = require('./src/config/db');

console.log('Checking GAP0001 status...');

db.query("SELECT id, nome, credential, senha FROM users WHERE credential = 'GAP0001'", (err, results) => {
    if (err) {
        console.error('Error querying user:', err);
        process.exit(1);
    }
    if (results.length > 0) {
        console.log('User found:', results[0]);
        if (results[0].senha === null) {
            console.log('SUCCESS: Password is NULL.');
        } else {
            console.log('WARNING: Password is NOT NULL (it is set).');
        }
    } else {
        console.log('User GAP0001 not found.');
    }
    process.exit(0);
});
