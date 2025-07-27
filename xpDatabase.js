const mysql = require('mysql2');

const db = mysql.createPool({
    host: '',
    port: ,
    user: '',
    password: '',
    database: ''
});

module.exports = {
    addXP: (userId, amount) => {
        db.query('SELECT * FROM user_xp WHERE user_id = ?', [userId], (err, results) => {
            if (err) { console.error('SELECT error:', err); return; }
            let newXP, newLevel;
            if (results.length > 0) {
                const row = results[0];
                newXP = row.xp + amount;
            } else {
                newXP = amount;
            }
            let level = 1;
            let needed = 100;
            let totalNeeded = 100;
            while (newXP >= totalNeeded) {
                level++;
                needed = level * 100;
                totalNeeded += needed;
            }
            if (results.length > 0) {
                db.query('UPDATE user_xp SET xp = ?, level = ?, last_msg = ? WHERE user_id = ?',
                    [newXP, level, Date.now(), userId], (err) => {
                        if (err) console.error('UPDATE error:', err);
                    });
            } else {
                db.query('INSERT INTO user_xp (user_id, xp, level, last_msg) VALUES (?, ?, ?, ?)',
                    [userId, newXP, level, Date.now()], (err) => {
                        if (err) console.error('INSERT error:', err);
                    });
            }
        });
    },
    getXP: (userId, callback) => {
        db.query('SELECT * FROM user_xp WHERE user_id = ?', [userId], (err, results) => {
            if (err) { console.error('SELECT error:', err); return callback(null); }
            callback(results[0]);
        });
    },
    getTopUsers: (limit, callback) => {
        db.query('SELECT * FROM user_xp ORDER BY level DESC, xp DESC LIMIT ?', [limit], (err, results) => {
            if (err) { console.error('SELECT TOP error:', err); return callback([]); }
            callback(results);
        });
    }
};
