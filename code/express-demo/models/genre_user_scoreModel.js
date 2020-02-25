var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});

var a = new mongoose.Schema({
    userID: String,
    genre: String,
    prob: Number,

} ,{collection: 'gus'});

var gus = mongoose.model('gus', a);

module.exports = gus;