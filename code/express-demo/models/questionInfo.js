var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});
const Schema = mongoose.Schema;

var questionInfo = new Schema({
    _id:String,
    type:String,
    required:String,
    question:String,
    options:String,
},{collection: 'questionInfo'});

var questionInfo = mongoose.model('questionInfo',questionInfo);


module.exports = questionInfo;