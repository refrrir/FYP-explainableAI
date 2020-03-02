var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});
const Schema = mongoose.Schema;

var userRating = new Schema({
    movieID:String,
    userID:String,
    title:String,
    score:String
},{collection: 'ratingInfo'});

var userRating = mongoose.model('userRating',userRating);


module.exports = userRating;