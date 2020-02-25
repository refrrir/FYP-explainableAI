var express = require('express');
var router = express.Router();
var ub = require('../models/userModel.js');
var gs = require('../models/genre_userModel.js');
var mg = require('../models/movie_genreModel.js');
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


// router.post('/add', function(req, res, next) {
//     const genre_set = new Set();
//     userID = req.body.userID;
//     algo = req.body.algo;
//     console.log("the algo is----->" + algo);
//
//     ub.find({userID: userID}).limit(10).exec(function (err, data) {
//         if (err) {
//             return console.log(err)
//         }
//         res.render('UserList', {
//             user: data
//         });
//
//         movie_list = data.map(function (doc) {
//             return doc.movieID;
//         });
//         scores = data.map(function (doc) {
//             return doc.score;
//         });
//
//         for (let i = 0; i < 10; i++) {
//             let g_score = new Map();
//             //store movie score given by algorithm db
//             movie_score.set(movie_list[i], scores[i]);
//             //console.log("for movie "+movie_list[i] +"score given by algorithm--->"+movie_score.get(movie_list[i]));
//
//             // search all genres related to this user
//             // store the genre prob of each movie: movie_genre_score = {}
//             // store the genre pro of this user: genre_user_score = {}
//             mg.find({userID: userID, movieID: movie_list[i]}, {genre: 1, score: 1}).exec(function (err, data) {
//                 if (err) {
//                     return console.log(err)
//                 }
//
//                 for (let dat of data) {
//                     g_score.set(dat.genre, dat.score);
//                     genre_set.add(dat.genre);
//                 }
//                 movie_genre_score.set(movie_list[i], g_score);
//                 // for(let thing of movie_genre_score.get(movie_list[i]).keys()){
//                 //     console.log("movie id "+movie_list[i] + "for genre "+ thing+"with score "+movie_genre_score.get(movie_list[i]).get(thing));
//                 // }
//
//
//
//             });
//             console.log("all genres ---->" + genre_set.size);
//         }
//
//         genre_set.forEach(function (genre, set) {
//             console.log("genre in set ---->" + genre);
//             gs.find({userID: id, genre: genre}, {pref: 1}).exec(function (err, data) {
//                 if (err) {
//                     return console.log(err)
//                 }
//                 genre_user_score.set(genre, data.pref);
//             });
//         });
//
//         for (let thing of genre_user_score.keys()) {
//             console.log("for genre " + thing + "with score for this user: " + genre_user_score.get(thing));
//         }
//
//     });
// });
// module.exports = router;

router.post('/add', function (req, res, next) {

    userID = req.body.userID;

    dev = req.body.dev;
    console.log(dev);

    ub.find({userID: userID}).limit(10).exec(function (err, data) {
        if (err) {
            return console.log(err)
        }

        // render initial movie list
        res.render('UserList', {
            user: data
        });

        // dev = 0, <userID : score> pair
        for (let dat of data) {
            movie_score.set(dat.movieID, dat.score);
        }

        re_rank(0.5, function (err, data) {
            if (err) console.log(err);
            else console.log(data.length);
            console.log('finished')
        });


    });

    // else {
    //     ub.find({userID: userID}).limit(10).sort('movieID').exec(function (err, data) {
    //         if (err) {
    //             return console.log(err)
    //         }
    //
    //         // render initial movie list
    //         res.render('UserList', {
    //             user: data
    //         });
    //
    //         // dev = 0, <userID : score> pair
    //         for (let dat of data) {
    //             movie_score.set(dat.movieID, dat.score);
    //         }
    //
    //         re_rank(0.5, function (err, data) {
    //             if (err) console.log(err);
    //             else console.log(data.length);
    //             console.log('finished')
    //         });
    //
    //
    //     });
    // }
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
        right_part = 0;
        for (let movie of movielist) {
            console.log("wwwwwwww"+movie);

            if (!dlist.has(movie)) {
                console.log("nonononoo");

                rb = 0
                for (let genre of moviegenrescore.get(movie).keys()) {

                    r =  usergenrescore.get(genre) * (moviegenrescore.get(movie)).get(genre);
                    // iterate movies in re-rank list
                    for (let newmovie of dlist) {
                        console.log("new movie each time -------->" + newmovie);
                        if (moviegenrescore.get(newmovie).keys().has(genre)) {
                            r = r +
                                (moviegenrescore.get(newmovie)).get(genre);
                        }
                    }
                    right_part = right_part + r
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