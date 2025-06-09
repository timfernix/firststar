const mysql = require('mysql2');

const db = mysql.createPool({
    host: '',
    port: ,
    user: '',
    password: '',
    database: ''
});

module.exports = {
    addSuggestion: (userId, title, description, canStream, callback) => {
        db.query(
            'INSERT INTO movie_night_suggestions (user_id, title, description, can_stream) VALUES (?, ?, ?, ?)',
            [userId, title, description, canStream ? 1 : 0],
            (err, result) => callback && callback(err, result)
        );
    },
    getSuggestions: (callback) => {
        db.query('SELECT * FROM movie_night_suggestions', (err, results) => callback(err, results));
    },
    deleteSuggestion: (id, callback) => {
        db.query('DELETE FROM movie_night_suggestions WHERE id = ?', [id], (err, result) => callback && callback(err, result));
    }
};
