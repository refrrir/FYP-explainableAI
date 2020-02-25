var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});

var movieGenreScore = new mongoose.Schema({
    userID: String,
    movieID: String,
    genre: String,
    score: Number,

} ,{collection: 'movie_genre_score'});

var movie_genre_score = mongoose.model('movie_genre_score', movieGenreScore);

module.exports = movie_genre_score;