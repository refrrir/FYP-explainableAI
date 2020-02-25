var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/movie', {useMongoClient: true});
const Schema = mongoose.Schema;

var movieInfo = new Schema({
    _id: { type: String, ref: 'ia' },
    itemName:String,
    genres:String
},{collection: 'movieInfo'});

const movie = mongoose.model('movie',movieInfo);


var itemas = new Schema({
    _id:Schema.Types.ObjectId,
    userID: String,
    genreID: String,
    itemID: String,
    score: Number,


 } ,{collection: 'itemAspects'});


var ia = mongoose.model('ia', itemas);
// var ib = mongoose.model('userID', userib);
// var hkv = mongoose.model('userID', userhkv);
// var pzt = mongoose.model('userID', userpzt);

module.exports = ia;
// module.exports = movie;
//module.exports = {ub,ib,hkv,pzt}
