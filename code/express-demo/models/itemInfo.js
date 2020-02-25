var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});
const Schema = mongoose.Schema;

var movieInfo = new Schema({
    _id:String,
    itemName:String,
    genres:String,
    posterUrl:String
},{collection: 'movieInfo'});

var movieInfo = mongoose.model('movieInfo',movieInfo);


module.exports = movieInfo;
