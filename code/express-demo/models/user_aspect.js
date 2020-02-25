var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});

var useras = new mongoose.Schema({
    userID: Number,
    genreID: Number,
    score: Number,
    

 } ,{collection: 'userAspects'});


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


var ua = mongoose.model('ua', useras);

// var ib = mongoose.model('userID', userib);
// var hkv = mongoose.model('userID', userhkv);
// var pzt = mongoose.model('userID', userpzt);

module.exports = ua;
//module.exports = {ub,ib,hkv,pzt}
