var express = require('express')
    , bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
var router = express.Router();
var formidable = require('formidable');
var csv = require("fast-csv");
var fs = require('fs');
var async = require("async");



var ua = require('../models/user_aspect.js');
var ia = require('../models/item_aspect.js');
var movieInfo = require('../models/itemInfo.js');
var userRating = require('../models/user_rating.js');
var questionInfo = require('../models/questionInfo.js');
var anserInfo = require('../models/answerinfo.js')


var _ = require('underscore');

var userID;
var topn;

const genreName = new Map([["1", "Action"], ["2", "Adventure"], ["3", "Animation"], ["4", "Children's"], ["5", "Comedy"], ["6", "Crime"], ["7", "Documentary"], ["8", "Drama"], ["9", "Fantasy"], ["10", "Film-Noir"], ["11", "Horror"], ["12", "Musical"], ["13", "Mystery"], ["14", "Romance"], ["15", "Sci-Fi"], ["16", "Thriller"], ["17", "War"], ["18", "Western"]]);

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

function retrieveItemAspect(regeneration, genres, topn, userID, callback) {
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
                    rec.set(String(i), rec.get(i) + score * genres[String(g)]);
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
                        if(genres.hasOwnProperty(genre)){
                            rec.set(item, rec.get(item) + score * genres[genre]);
                        }
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
        arrayObj = arrayObj.sort(function (a, b) { 
            if(isNaN(b[1])) { 
                return 1-isNaN(a[1]);
            }
            else{
                return b[1] - a[1];
            }
        }).slice(0, 10);

        var newObj = {};
        for (var dat in arrayObj) {
            newObj[arrayObj[String(dat)][0]] = genreObject[arrayObj[dat][0]];
        }
        genreObject = newObj;
        result.genrePro = genreObject;

        var sortable = [];
        for (var key in genres) {
            sortable.push([key, genres[key]]);
        }

        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });
        if(sortable.length > 9){
            sortable = sortable.slice(0,10);
        }
        var highest = sortable[0][1];

        var objSorted = {};
        var genreRanking = {};
        var i = 1;
        sortable.forEach(function(item){
            objSorted[item[0]]=item[1];
            genreRanking[item[0]] = i;
            i ++;
        })
        // console.log(genreRanking);

        result.genres = objSorted;
        result.highest = highest;
        result.genreRanking = genreRanking;
        // result.topn = topn;
        var ids = [];
        var m = 0
        arrayObj.forEach(function (entry, index) {
            ids[m] = entry[0];
            m = m + 1;
        });
        movieInfo.find({ _id: ids }).exec(function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                // console.log("result is " + data);
                for (let dat in data) {
                    for (j = 0, len = arrayObj.length; j < len; j++) {

                        if (arrayObj[j][0] == data[dat]._id) {
                            arrayObj[j][2] = data[dat].itemName;
                            arrayObj[j][3] = data[dat].posterUrl;
                        }
                    }
                }
                result.recPro = arrayObj;
                callback(null, result);
            }
        });

    });
}

router.post('/explanation',function (req,res,next){

    var type = req.body.explanationtype;

    userID = req.body.userID;
    topn = 10;
    dev = req.body.dev;
    retrieveUserAspect(userID, function (err, genres) {
        if (err) {
            console.log(err);
        }
        retrieveItemAspect(null, genres, userID, topn, function (err, rec) {
            if(type == 'sliderexplanation'){
                res.render('sliderExplanation', {
                    recPro : rec.recPro,
                    genrePro: rec.genrePro,
                    genres: rec.genres,
                    userID, userID,
                    genreName: genreName,
                    highest: rec.highest,
                    genreRanking: rec.genreRanking,
                });
            }else if(type == 'textexplanation'){
                res.render('textExplanation', {
                    recPro : rec.recPro,
                    genrePro: rec.genrePro,
                    genres: rec.genres,
                    userID, userID,
                    genreName: genreName,
                    highest: rec.highest,
                    genreRanking: rec.genreRanking,
                });
            }else if(type == 'noexplanation'){
                res.render('noExplanation', {
                    recPro : rec.recPro,
                    genrePro: rec.genrePro,
                    genres: rec.genres,
                    userID, userID,
                    genreName: genreName,
                    highest: rec.highest,
                    genreRanking: rec.genreRanking,
                });
            }
        })
    });




});







router.post('/update', function (req, res, next) {

    console.log(req.body);


    retrieveUserAspect(userID, function (err, genres) {
        if (err) {
            console.log(err);
        }
        retrieveItemAspect(req.body, genres, userID, 10, function (err, rec) {
            res.send({
                recPro : rec.recPro,
                genrePro: rec.genrePro,
                genres: rec.genres,
                userID, userID,
                genreName: genreName,
                highest: rec.highest,
                genreRanking: rec.genreRanking,

            });
        })
        
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

router.post('/submitsurvey' ,function(req,res,next){
    anserInfo.find().sort({submitId : -1}).limit(1).exec(function (err, data) {
        var sId;
        if (data.length == 0){
            sId = 1;
        }else{
            sId = parseInt(data.pop().submitId) + 1;
        }
        var ans = req.body;
        var arr = [];
        for(var a in ans){
            var record = {};
            record.submitId = sId;
            record.question = ans[a][0];
            record.answer = ans[a][1];
            arr.push(record);
        }
        console.log(arr);
        anserInfo.insertMany(arr, function(error, docs) {
            console.log("insert success!");
            res.render("complete");
        });
        // anserInfo.s

    });

});

router.get('/administration', function (req, res, next) {
    res.render('admin');

});

router.post('/upload-useraspect', function (req, res, next) {
    req.setTimeout(0);
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload1.path;
        var newpath = process.cwd() + "/" + files.filetoupload1.name;
        console.log(newpath);
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.render('admin', {
                    message1: '<div class="alert alert-danger" role="alert">no file selected</div>',
                });

            } else {
                var fileStream = fs.createReadStream(newpath);
                var parser = csv.parse({ headers: true });
                var dataArr = [];
                var error = 0;
                fileStream
                    .pipe(parser)
                    .on('error', error => error)
                    .on("data", function (data) {
                        if (!(data.hasOwnProperty('userID')) || !(data.hasOwnProperty('genreID')) || !(data.hasOwnProperty('score')) || (data.hasOwnProperty('itemID'))) {
                            error = 1;
                            res.render('admin', {
                                message1: '<div class="alert alert-danger" role="alert">Incorrect format</div>',
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
                                        message1:'<div class="alert alert-danger" role="alert">error!</div>',
                                    });
                                }else{
                                    res.render('admin',{
                                        message1:'<div class="alert alert-success" role="alert">Success!</div>',
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


router.post('/upload-itemaspect', function (req, res, next) {
    req.setTimeout(0);
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload2.path;
        var newpath = process.cwd() + "/" + files.filetoupload2.name;
        console.log(newpath);
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.render('admin', {
                    message2: '<div class="alert alert-danger" role="alert">no file selected</div>',
                });

            } else {
                var fileStream = fs.createReadStream(newpath);
                var parser = csv.parse({ headers: true });
                var dataArr = [];
                var error = 0;
                fileStream
                    .pipe(parser)
                    .on('error', error => error)
                    .on("data", function (data) {
                        if (!(data.hasOwnProperty('userID')) || !(data.hasOwnProperty('genreID')) || !(data.hasOwnProperty('itemID')) || !(data.hasOwnProperty('score'))) {
                            error = 1;
                            res.render('admin', {
                                message2: '<div class="alert alert-danger" role="alert">Incorrect format</div>',
                            });
                        } else {
                            var item = new ia({
                                userID: parseInt(data.userID),
                                genreID: parseInt(data.genreID),
                                itemID: parseInt(data.itemID),
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
                                    console.log(err);
                                    res.render('admin',{
                                        message2:'<div class="alert alert-danger" role="alert">error!</div>',
                                    });
                                }else{
                                    res.render('admin',{
                                        message2:'<div class="alert alert-success" role="alert">Success!</div>',
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

router.post('/upload-ratings', function (req, res, next) {
    req.setTimeout(0);
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload3.path;
        var newpath = process.cwd() + "/" + files.filetoupload3.name;
        console.log(newpath);
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                console.log(err);
                res.render('admin', {
                    message3: '<div class="alert alert-danger" role="alert">no file selected</div>',
                });

            } else {
                var fileStream = fs.createReadStream(newpath);
                var parser = csv.parse({ headers: true });
                var dataArr = [];
                var error = 0;
                fileStream
                    .pipe(parser)
                    .on('error', error => error)
                    .on("data", function (data) {
                        if (!(data.hasOwnProperty('userID')) || !(data.hasOwnProperty('movieID')) ||  !(data.hasOwnProperty('score'))) {
                            error = 1;
                            res.render('admin', {
                                message3: '<div class="alert alert-danger" role="alert">Incorrect format</div>',
                            });
                        } else {
                            var item = new userRating({
                                movieID: parseInt(data.movieID),
                                userID: parseInt(data.userID),
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
                                        message3:'<div class="alert alert-danger" role="alert">error!</div>',
                                    });
                                }else{
                                    res.render('admin',{
                                        message3:'<div class="alert alert-success" role="alert">Success!</div>',
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

router.post('/upload-movies', function (req, res, next) {
    req.setTimeout(0);
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload4.path;
        var newpath = process.cwd() + "/" + files.filetoupload4.name;
        console.log(newpath);
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                console.log(err);
                res.render('admin', {
                    message3: '<div class="alert alert-danger" role="alert">no file selected</div>',
                });

            } else {
                var fileStream = fs.createReadStream(newpath);
                var parser = csv.parse({ headers: true });
                var dataArr = [];
                var error = 0;
                fileStream
                    .pipe(parser)
                    .on('error', error => error)
                    .on("data", function (data) {
                        if (!(data.hasOwnProperty('_id')) || !(data.hasOwnProperty('itemName')) ||  !(data.hasOwnProperty('genres'))  ||  !(data.hasOwnProperty('posterUrl'))) {
                            error = 1;
                            res.render('admin', {
                                message4: '<div class="alert alert-danger" role="alert">Incorrect format</div>',
                            });
                        } else {
                            var item = new movieInfo({
                                _id: parseInt(data._id),
                                itemName: data.itemName,
                                genres: data.genres,
                                posterUrl: data.posterUrl
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
                                        message4:'<div class="alert alert-danger" role="alert">error!</div>',
                                    });
                                }else{
                                    res.render('admin',{
                                        message4:'<div class="alert alert-success" role="alert">Success!</div>',
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

module.exports = router;