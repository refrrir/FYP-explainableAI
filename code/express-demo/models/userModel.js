var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});

var userub = new mongoose.Schema({
    userID: String,
    movieID: String,
    title: String,
    score: Number

 } ,{collection: 'algo_ub'});

// var userib = new mongoose.Schema({
//     userID: String,
//     movieID: String,
//     title: String,
//     score: Number
//
// } ,{collection: 'ib'})
//
// var userhkv = new mongoose.Schema({
//     userID: String,
//     movieID: String,
//     title: String,
//     score: Number
//
// } ,{collection: 'hkv'})
// var userub = new mongoose.Schema({
//     userID: String,
//     movieID: String,
//     title: String,
//     score: Number
//
// } ,{collection: 'pzt'})


var ub = mongoose.model('ub', userub);

// var ib = mongoose.model('userID', userib);
// var hkv = mongoose.model('userID', userhkv);
// var pzt = mongoose.model('userID', userpzt);

module.exports = ub;
//module.exports = {ub,ib,hkv,pzt}
