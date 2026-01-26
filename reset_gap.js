require('dotenv').config();
const db = require('./src/config/db');

console.log('Resetting GAP0001 password to NULL...');

const query = "UPDATE users SET senha = NULL WHERE credential = 'GAP0001'";

db.query(query, (err, result) => {
    if (err) {
        console.error('Error resetting credential:', err);
        process.exit(1);
    }
    console.log('Result:', result);
    console.log('GAP0001 password reset successfully.');
    process.exit(0);
});
