var express = require('express')
  , bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
var router = express.Router();
var ub = require('../models/userModel.js');
var gs = require('../models/genre_userModel.js');
var mg = require('../models/movie_genreModel.js');
var ua = require('../models/user_aspect.js');
var ia = require('../models/item_aspect.js');
var movieInfo = require('../models/itemInfo.js');


var _ = require('underscore');

var gs_rerank = require('../models/genre_user_scoreModel.js');
var mgs_rerank = require('../models/movie_genre_scoreModel.js');

var userID;
// rank list store movie id
var movie_list;

// the movie:score given by algorithm
var movie_score = new Map();
// genres set of this user
genre_set = new Set();

// store data into appropriate structure
moviegenrescore = new Map();
usergenrescore = new Map();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.redirect('/users/list');
});

// show movie list
router.get('/list', function (req, res, next) {
    userModel.find(function (err, data) {
        if (err) {
            return console.log(err)
        }
        console.log("user list page");
        // res.render('UserList', {
        //     user: data
        // })
    })
});

// search initial movie list and re-rank
router.get('/add', function (req, res, next) {
    res.render('UserAdd');
});

function retrieveUserAspect(userID, callback) {
    ua.find({userID: userID}).exec(function (err, data) {
        let genres = {};

        if (err) {
            callback(err, null);
        }else{    
            for(let dat of data){
                if(dat.score != 0){
                    var p = 0;
                    genres[dat.genreID] = dat.score;
                    
                }
            }
            callback(null, genres);
        }

    });
};

function retrieveItemAspect(regeneration,genres,userID, callback){
//     Story.
//   findOne({ title: 'Casino Royale' }).
//   populate('author').
//   exec(function (err, story) {
//     if (err) return handleError(err);
//     console.log('The author is %s', story.author.name);
//     // prints "The author is Ian Fleming"
//   });
    ia.find({userID:String(userID)}).exec(function(err,data){
        let result = {};
        let rec = new Map();
        let genreObject = {};
        if (err){
            callback(err,null);
        }else{
            // console.log("data is" + data);
            for (let dat of data){
                var g = dat.genreID;
                var score = dat.score;
                var i = dat.itemID;
                // console.log("item is" + item);
                // console.log(dat);
                // console.log("sss");
                // console.log(g);
                if(score != 0){
                    if(!rec.has(i)){
                        rec.set(i,0);
                        genreObject[String(i)] = {};
                    }
                    genreObject[String(i)][String(g)] = score;
                    rec.set(String(i),rec.get(i) + score * genres[g]);
                }

            }
        }

        if(regeneration != null){
            rec = new Map();
            var genre_score = regeneration.genre_score;
            genres = genre_score;
            var genrePro = regeneration.genrePro;
            // console.log(genrePro);
            Object.keys(genrePro).forEach(function(item){
                Object.keys(genrePro[item]).forEach(function(genre){
                    // console.log(genreObject[String(item)][String(genre)]);
                    genreObject[String(item)][String(genre)] = genrePro[String(item)][String(genre)];
                    // console.log(genreObject[String(item)][String(genre)]);
                });        
            });
            Object.keys(genreObject).forEach(function(item){
                Object.keys(genreObject[item]).forEach(function(genre){
                    var score = genreObject[String(item)][String(genre)];
                    // console.log(score);
                    // rec.set(item,rec.get(item) + score * genres[genre]);

                    if(score != 0){
                        if(!rec.has(item)){
                            rec.set(item,0);
                        }
                        rec.set(item,rec.get(item) + score * genres[genre]);
                    }
                });        
            });
            if(score != 0){
                    if(!rec.has(i)){
                        rec.set(i,0);
                        genreObject[String(i)] = {};
                    }
                    genreObject[String(i)][String(g)] = score;
                    rec.set(String(i),rec.get(i) + score * genres[g]);
                }
            console.log("in");
        }
        else{
            console.log("out");
        }
        var arrayObj=Array.from(rec);
        arrayObj = arrayObj.sort(function(a,b){return b[1]-a[1]}).slice(0,10);

        var newObj = {};
        for (var dat in arrayObj){
            newObj[arrayObj[String(dat)][0]] = genreObject[arrayObj[dat][0]];
        }
        genreObject = newObj;
        result.genrePro = genreObject;
        result.genres = genres;

        var ids = [];
        var m = 0
        arrayObj.forEach(function(entry,index) {
            ids[m] = entry[0];
            m = m + 1;
        });
        // ids.sort(function(a, b){return a-b});
        // console.log("ids is " + ids);
        movieInfo.find({_id:ids}).exec(function(err,data){
            if(err){
                callback(err,null);
            }else{
                // console.log("result is " + data);
                for(let dat in data){
                    for(j = 0,len=arrayObj.length; j < len; j++) {
                        // console.log(arrayObj[j][0]);
                        // console.log(data[dat]._id);

                        if(arrayObj[j][0] == data[dat]._id){
                            arrayObj[j][2] = data[dat].itemName;
                            arrayObj[j][3] = data[dat].posterUrl;
                            // console.log(data[dat]);
                        }
                    }
                }
                result.recPro = arrayObj;
                callback(null,result);
            }
        });

        // console.log(result.recPro);

    });
}



router.post('/add', function (req, res, next) {

    userID = req.body.userID;

    dev = req.body.dev;
    // console.log(dev);

    retrieveUserAspect(userID, function(err, genres) {
        if (err) {
          console.log(err);
        }
        retrieveItemAspect(null,genres,userID,function(err,rec){
            res.render('UserList', {
                // data: genres,
                rec:rec,
                userID,userID,
            });
            // console.log(rec);
        })
        // res.render('UserList', {
        //     data: genres
        // });
      });   

});

router.post('/update',function (req,res,next){
    // var rec = req.body.genre_score;
    // console.log(rec);
    // console.log(req);
    // console.log(req.body);
    // console.log("rec is");
    // console.log(rec);
    retrieveUserAspect(userID, function(err, genres) {
        if (err) {
          console.log(err);
        }
        retrieveItemAspect(req.body,genres,userID,function(err,rec){
            res.render('UserList', {
                // data: genres,
                rec:rec,
                userID,userID
            });
            // console.log(rec);
        })
        // res.render('UserList', {
        //     data: genres
        // });
    }); 

});


function getMovieGenreScore(userid, movielist) {
    var all_genres = new Set();

    for (let movie of movielist) {

        mg.find({userID: userid, movieID: movie}, {genre: 1, score: 1}).exec(function (err, genrewithscore) {
            if (err) {
                return console.log(err)
            }
            for (let pair of genrewithscore) {

                if (!all_genres.has(pair.genre)) {
                    getAllGenreUserScore(userID, pair.genre);
                    all_genres.add(pair.genre);
                }

                //save movie-genre-score
                var newmgs = new mgs_rerank({
                    userID: userid,
                    movieID: movie,
                    genre: pair.genre,
                    prob: pair.score
                });
                newmgs.save(function (err, data) {
                    if (err) {
                        return console.log(err)
                    }
                    // console.log("store movie genre prob!");
                });

            }
        });
    }
}

function getAllGenreUserScore(user, genre) {
    // store all genre
    gs.find({userID: user, genre: genre}, {pref: 1}).exec(function (err, genrescore) {
        if (err) {
            return console.log(err)
        }
        for (let s of genrescore) {
            console.log(s.pref);
            var newgus = new gs_rerank({
                userID: user,
                genre: genre,
                prob: s.pref
            })

            newgus.save(function (err, data) {
                if (err) {
                    return console.log(err)
                }
            });
        }

    });
}

function re_rank(a, callback) {
    createmgs(function () {
        creategs(function () {
            calculating(a, movie_score.keys(), movie_score, moviegenrescore, usergenrescore, callback
            );
        });
    });
}

function createmgs(cb) {
    mgs_rerank.find({userID: userID}, {movieID: 1, genre: 1, prob: 1}).exec(function (err, data) {
        if (err) {
            return console.log(err)
        }
        for (let dat of data) {
            let val = new Map();
            val.set(dat.genre, dat.prob);
            moviegenrescore.set(dat.movieID, val);
        }

        cb(null, moviegenrescore);
    });
};


function creategs(cb) {
    gs_rerank.find({userID: userID}, {genre: 1, prob: 1}).exec(function (err, data) {
        if (err) {
            return console.log(err)
        }
        for (let dat of data) {
            usergenrescore.set(dat.genre, dat.prob);
        }

        cb(null, usergenrescore);
    });
};

function calculating(a, ml, moviescore, moviegenrescore, usergenrescore, cb) {
    dlist = new Set();
    movielist = new Set();
    // construct new list
    // remove top1 movieID from origin list
    for (let m of ml) {
        movielist.add(m);
    }

    for (count = 0; count != 10; count++) {
        dev_score = new Map();
        for (let movie of movielist) {
            console.log("wwwwwwww"+movie);
            if (!dlist.has(movie)) {
                console.log("nonononoo");
                right_part = 0;
                for (let genre of moviegenrescore.get(movie).keys()) {
                    // iterate movies in re-rank list
                    for (let newmovie of dlist) {
                        console.log("new movie each time -------->" + newmovie);
                        if (moviegenrescore.get(newmovie).keys().has(genre)) {
                            right_part += usergenrescore.get(genre) * (moviegenrescore.get(movie)).get(genre) *
                                (1 - (moviegenrescore.get(newmovie)).get(genre));
                        } else {
                            right_part += usergenrescore.get(genre) * (moviegenrescore.get(movie)).get(genre)
                        }
                    }
                }
            }
            dev_score.set(movie, (1 - a) * moviescore.get(movie) + a * right_part);
        }
        //const max = Object.entries(dev_score).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        console.log("max one ------" + max);

        dlist.add(max);
        console.log("list2 size------------>" + dlist.size);
    }

    cb(null, dlist);
}


module.exports = router;