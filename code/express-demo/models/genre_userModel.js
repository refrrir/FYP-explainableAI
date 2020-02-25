var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});

var genreScore = new mongoose.Schema({
    userID: String,
    genre: String,
    pref: Number,
} ,{collection: 'genre_user'});

var genre_user = mongoose.model('genre_user', genreScore);

module.exports = genre_user;