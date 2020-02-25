var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});

var moviegenrescore = new mongoose.Schema({
    userID: String,
    movieID: String,
    genre: String,
    prob: Number,

} ,{collection: 'mgs'});

var mgs = mongoose.model('mgs', moviegenrescore);

module.exports = mgs;