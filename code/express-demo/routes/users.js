var express = require('express')
    , bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
var router = express.Router();
var formidable = require('formidable');
var csv = require("fast-csv");
var fs = require('fs');
var async = require("async");



var ub = require('../models/userModel.js');
var gs = require('../models/genre_userModel.js');
var mg = require('../models/movie_genreModel.js');
var ua = require('../models/user_aspect.js');
var ia = require('../models/item_aspect.js');
var movieInfo = require('../models/itemInfo.js');
var userRating = require('../models/user_rating.js');
var questionInfo = require('../models/questionInfo.js');


var _ = require('underscore');

var gs_rerank = require('../models/genre_user_scoreModel.js');
var mgs_rerank = require('../models/movie_genre_scoreModel.js');

var userID;
var topn;
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
    ua.find({ userID: userID }).exec(function (err, data) {
        let genres = {};

        if (err) {
            callback(err, null);
        } else {
            for (let dat of data) {
                if (dat.score != 0) {
                    var p = 0;
                    genres[dat.genreID] = dat.score;

                }
            }
            callback(null, genres);
        }

    });
};

function retrieveItemAspect(regeneration, genres, userID, topn, callback) {
    //     Story.
    //   findOne({ title: 'Casino Royale' }).
    //   populate('author').
    //   exec(function (err, story) {
    //     if (err) return handleError(err);
    //     console.log('The author is %s', story.author.name);
    //     // prints "The author is Ian Fleming"
    //   });
    ia.find({ userID: String(userID) }).exec(function (err, data) {
        let result = {};
        let rec = new Map();
        let genreObject = {};
        if (err) {
            callback(err, null);
        } else {
            // console.log("data is" + data);
            for (let dat of data) {
                var g = dat.genreID;
                var score = dat.score;
                var i = dat.itemID;
                if (score != 0) {
                    if (!rec.has(i)) {
                        rec.set(i, 0);
                        genreObject[String(i)] = {};
                    }
                    genreObject[String(i)][String(g)] = score;
                    rec.set(String(i), rec.get(i) + score * genres[g]);
                }

            }
        }

        if (regeneration != null) {
            rec = new Map();
            var genre_score = regeneration.genre_score;
            genres = genre_score;
            var genrePro = regeneration.genrePro;
            // console.log(genrePro);
            Object.keys(genrePro).forEach(function (item) {
                Object.keys(genrePro[item]).forEach(function (genre) {
                    // console.log(genreObject[String(item)][String(genre)]);
                    genreObject[String(item)][String(genre)] = genrePro[String(item)][String(genre)];
                    // console.log(genreObject[String(item)][String(genre)]);
                });
            });
            Object.keys(genreObject).forEach(function (item) {
                Object.keys(genreObject[item]).forEach(function (genre) {
                    var score = genreObject[String(item)][String(genre)];
                    // console.log(score);
                    // rec.set(item,rec.get(item) + score * genres[genre]);

                    if (score != 0) {
                        if (!rec.has(item)) {
                            rec.set(item, 0);
                        }
                        rec.set(item, rec.get(item) + score * genres[genre]);
                    }
                });
            });
            // if(score != 0){
            //         if(!rec.has(i)){
            //             rec.set(i,0);
            //             genreObject[String(i)] = {};
            //         }
            //         genreObject[String(i)][String(g)] = score;
            //         rec.set(String(i),rec.get(i) + score * genres[g]);
            //     }
            console.log("in");
        }
        else {
            console.log("out");
        }
        var arrayObj = Array.from(rec);
        arrayObj = arrayObj.sort(function (a, b) { return b[1] - a[1] }).slice(0, topn);

        var newObj = {};
        for (var dat in arrayObj) {
            newObj[arrayObj[String(dat)][0]] = genreObject[arrayObj[dat][0]];
        }
        genreObject = newObj;
        result.genrePro = genreObject;
        result.genres = genres;
        result.topn = topn;
        var ids = [];
        var m = 0
        arrayObj.forEach(function (entry, index) {
            ids[m] = entry[0];
            m = m + 1;
        });
        // ids.sort(function(a, b){return a-b});
        // console.log("ids is " + ids);
        movieInfo.find({ _id: ids }).exec(function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                // console.log("result is " + data);
                for (let dat in data) {
                    for (j = 0, len = arrayObj.length; j < len; j++) {
                        // console.log(arrayObj[j][0]);
                        // console.log(data[dat]._id);

                        if (arrayObj[j][0] == data[dat]._id) {
                            arrayObj[j][2] = data[dat].itemName;
                            arrayObj[j][3] = data[dat].posterUrl;
                            // console.log(data[dat]);
                        }
                    }
                }
                result.recPro = arrayObj;
                callback(null, result);
            }
        });

        // console.log(result.recPro);

    });
}



router.post('/add', function (req, res, next) {

    userID = req.body.userID;
    topn = req.body.topn;
    dev = req.body.dev;
    if (typeof topn === "undefined") {
        topn = 10;
    }
    console.log(topn);
    retrieveUserAspect(userID, function (err, genres) {
        if (err) {
            console.log(err);
        }
        retrieveItemAspect(null, genres, userID, topn, function (err, rec) {
            res.render('UserList', {
                // data: genres,
                rec: rec,
                userID, userID,
            });
            // console.log(rec);
        })
        // res.render('UserList', {
        //     data: genres
        // });
    });

});

router.post('/update', function (req, res, next) {
    // var rec = req.body.genre_score;
    // console.log(rec);
    // console.log(req);
    // console.log(req.body);
    // console.log("rec is");
    // console.log(rec);
    // topn = req.body.topn;
    // if(typeof topn === "undefined"){
    //     topn = 10;
    // }
    retrieveUserAspect(userID, function (err, genres) {
        if (err) {
            console.log(err);
        }
        retrieveItemAspect(req.body, genres, userID, topn, function (err, rec) {
            res.render('UserList', {
                // data: genres,
                rec: rec,
                userID, userID
            });
            // console.log(rec);
        })
        // res.render('UserList', {
        //     data: genres
        // });
    });

});


router.post('/display', function (req, res, next) {

    userID = req.body.userID;
    userRating.find({ userID: userID }).exec(function (err, data) {
        var ratings = {};
        var ids = [];
        var i = 0;
        if (err) {
            callback(err, null);
        } else {
            for (let dat of data) {
                ratings[dat.movieID] = {};
                ratings[dat.movieID].score = dat.score;
                ids[i] = dat.movieID;
                i++;
            }
        }

        movieInfo.find({ _id: ids }).exec(function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                summary = {};
                for (let dat in data) {

                    genres = data[dat].genres.trim().split("|");
                    for (let genre of genres) {
                        if (!(genre in summary)) {
                            summary[genre] = [1, parseInt(ratings[data[dat]._id].score)];

                        } else {
                            number = summary[genre][0] + 1;
                            score = summary[genre][1] + parseFloat(ratings[data[dat]._id].score)
                            summary[genre] = [number, score];
                        }

                    }

                    if (data[dat].posterUrl == "") {
                        delete ratings[data[dat]._id];
                    }
                    else {
                        ratings[data[dat]._id].movieName = data[dat].itemName;
                        ratings[data[dat]._id].posterUrl = data[dat].posterUrl;

                    }


                }
                for (let genre in summary) {
                    summary[genre][1] = (summary[genre][1] / summary[genre][0]).toFixed(1);
                    i++;
                    // if(i > 9){
                    //     summary[genre][]
                    // }
                }
                console.log(summary);
                // console.log(Object.keys(ratings).length);
                // console.log(ratings);
                res.render('UserAdd', {
                    ratings: ratings,
                    userID: userID,
                    summary: summary,
                    total: ids.length,
                });
            }
        });


    });

});

router.get('/survey', function (req, res, next) {
    questionInfo.find().exec(function (err, data) {
        if (err) {
            callback(err, null);
        } else {
            // console.log(data);
            optionsObj = {};
            for (dat in data) {
                if (data[dat].type == 'inlineRadio' || data[dat].type == 'radio' || data[dat].type == 'checkbox') {
                    // console.log(JSON.stringify(data[dat]));
                    // console.log(data[dat]["numOfOptions"]);
                    // data[dat].numOfOptions = parseInt(data[dat].numOfOptions);
                    // console.log(data[dat].numOfOptions);
                    var id = data[dat]._id;
                    var o = data[dat].options.split("&");
                    optionsObj[id] = o;
                    // optionsObj[id].push(o.length);

                }
            }
            console.log(optionsObj);
            console.log(data);
            res.render('survey', {
                data: data,
                optionsObj: optionsObj,
            });

        }
    });

});

router.get('/administration', function (req, res, next) {
    res.render('admin');

});

router.post('/fileupload', function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload1.path;
        var newpath = '/Users/huang/Desktop/FYP-explainableAI/code/express-demo/' + files.filetoupload1.name;
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.render('admin', {
                    message: '<div class="alert alert-danger" role="alert">no file selected</div>',
                });

            } else {
                var fileStream = fs.createReadStream(newpath);
                var parser = csv.parse({ headers: true });
                var dataArr = [];
                var error = 0;
                fileStream
                    .pipe(parser)
                    .on('error', error => error)
                    // .on('readable', () => {
                    //     for (let row = parser.read(); row; row = parser.read()) {
                    //         // console.log(`ROW=${JSON.stringify(row)}`);
                    //     }
                    // })
                    .on("data", function (data) {
                        if (!(data.hasOwnProperty('userID')) || !(data.hasOwnProperty('genreID')) || !(data.hasOwnProperty('score'))) {
                            error = 1;
                            res.render('admin', {
                                message: '<div class="alert alert-danger" role="alert">Incorrect format</div>',
                            });
                        } else {
                            var item = new ua({
                                userID: parseInt(data.userID),
                                genreID: parseInt(data.genreID),
                                score: parseFloat(data.score)
                            });
                        }
                        dataArr.push(item);

                    })
                    .on("end", () => {
                        if (error != 1) {
                            async.eachSeries(dataArr, function (item, asyncdone) {
                                item.save(asyncdone);
                            }, function (err) {
                                                                
                                if (err){
                                    res.render('admin',{
                                        message:'<div class="alert alert-danger" role="alert">error!</div>',
                                    });
                                }else{
                                    res.render('admin',{
                                        message:'<div class="alert alert-success" role="alert">Success!</div>',
                                    });
                                }
                            });
                        } else {
                            console.log("error!");
                        }

                    });
            }
        });

    });
});


function getMovieGenreScore(userid, movielist) {
    var all_genres = new Set();

    for (let movie of movielist) {

        mg.find({ userID: userid, movieID: movie }, { genre: 1, score: 1 }).exec(function (err, genrewithscore) {
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
    gs.find({ userID: user, genre: genre }, { pref: 1 }).exec(function (err, genrescore) {
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
    mgs_rerank.find({ userID: userID }, { movieID: 1, genre: 1, prob: 1 }).exec(function (err, data) {
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
    gs_rerank.find({ userID: userID }, { genre: 1, prob: 1 }).exec(function (err, data) {
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
            console.log("wwwwwwww" + movie);
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