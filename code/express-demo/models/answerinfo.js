var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});
const Schema = mongoose.Schema;

var questionInfo = new Schema({
    _id:String,
    submitId:String,
    question:String,
    answer:String,
},{collection: 'answerInfo'});

var questionInfo = mongoose.model('answerInfo',questionInfo);


module.exports = questionInfo;