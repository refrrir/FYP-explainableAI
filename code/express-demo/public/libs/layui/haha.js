var rec = {"recPro":[["733",0.151270639885],["2762",0.14671],["608",0.14594229256799998],["2193",0.144256042673],["2006",0.143659290982],["1275",0.142800821145],["653",0.142056382563],["1704",0.141504],["3489",0.140630504856],["2858",0.140399910592]],"genrePro":{"608":{"6":0.673964,"8":0.445308,"16":0.374368},"653":{"1":0.572575,"2":0.480906,"9":0.395546},"733":{"1":0.594527,"2":0.499344,"16":0.142219},"1275":{"1":0.651037,"2":0.546807},"1704":{"8":1},"2006":{"1":0.588492,"2":0.494274,"14":0.309751},"2193":{"1":0.581005,"2":0.487987,"9":0.403966},"2762":{"16":1},"2858":{"5":1,"8":0.460898},"3489":{"2":0.827706,"9":0.678102}},"genres":{"1":0.105285,"2":0.1358,"3":0.005788,"4":0.03358,"5":0.075181,"6":0.041554,"8":0.141504,"9":0.041628,"10":0.00764,"11":0.007455,"12":0.009372,"13":0.022919,"14":0.047062,"15":0.122729,"16":0.14671,"17":0.041646,"18":0.014148}};
        var userID = "13";
        var recommList = rec.recPro;
        var genrePro = rec.genrePro;
        var genres = rec.genres;
        var numOfGen = genres.size;
        setPara(genres);
        change(randomData());
        var sliderarea = document.getElementById("sliderarea");
        var recarea = document.getElementById("recarea");
        window.οnlοad = loadSliders(numOfGen, sliderarea, 'slider');
        window.οnlοad = loadRec(recommList);
        function loadRec(recList){
            for (var r in recList){
                movieID = recommList[r][0];
                score = recommList[r][1];
                recarea.innerHTML=recarea.innerHTML + "<div class='container border border-light rounded-lg col-11 box-shadow' id='container" + String(movieID) + "'><div class='row'><div class='col-1 cell'><p>" + movieID 
                    + "</p></div> <div class='col-2'><img width=400px height=300px style='padding:50px'></div><div class='col-9'><div class='container'><div class='row'><div class='col-6 cell'><p>" + score
                    + "</p></div><div class='col-5' id='sliderarea2' class='sliderarea'></div></div></div></div></div></div>";
            }
        }
        for (var r in genrePro){
            // console.log(r + " " + genrePro[r] + "container" + String(r));
            var sliderareas = document.getElementById("container" + String(r));
            window.οnlοad = loadSliders2(genrePro[r], sliderareas,"slider" + String(r));
        }

        function executeScript(html)
{
    var reg = /<script[^>]*>([^\x00]+)$/i;
    //对整段HTML片段按<\/script>拆分
    var htmlBlock = html.split("<\/script>");
    for (var i in htmlBlock) 
    {
        var blocks;//匹配正则表达式的内容数组，blocks[1]就是真正的一段脚本内容，因为前面reg定义我们用了括号进行了捕获分组
        if (blocks = htmlBlock[i].match(reg)) 
        {
            //清除可能存在的注释标记，对于注释结尾-->可以忽略处理，eval一样能正常工作
            var code = blocks[1].replace(//, '');
            console.log(code);
            eval(code);//执行脚本

            // try 
            // {
            //     console.log(code);
            //     eval(code) //执行脚本
            // } 
            // catch (e) 
            // {
            //     console.log(e)
            // }
        }
    }
}
$(document).ready(function () {
    $("#sliderarea .slider").change(function () {
        var index = this.id.replace("slider ", "");
        var value = this.value / 100;
        // console.log('value is' + value);
        genre_score[String(index)] = value;
        // console.log('genre is ' + index);
        // console.log(genre_score);
        // console.log(genre_score.get(genres[index]));
        change(randomData());
    });
    $(".movieslider .slider").change(function () {
        var index = this.id.replace("slider", "").split(" ");
        var movieID = index[0];
        var genreID = index[1];
        // console.log("movie ID is " + movieID + " genreID is" + genreID);
        var value = this.value / 100;
        genrePro[movieID][genreID] = value;
        // console.log(genrePro[movieID][genreID]);

        // change(randomData());
    });
    $('#regenerate').click(function(){ 
        // var genre_score = getPara(); 
        // const obj = {};
        // for (const key of genre_score.keys()) {
        //     obj[key] = genre_score.get(key);
        // }
        // genre_score = obj;
        // console.log(obj);
        // console.log(genre_score);
        $.ajax({ 
            url: '/users/update',
            type: 'POST',
            cache: false, 
            contentType: "application/json",
            data: JSON.stringify({ 
                genre_score: genre_score,
                genrePro: genrePro,
                userID: userID
            }), 
            success: function(data){
                // console.log(data.userID);
                //  console.log(data);

                // console.log(userID);

                // recommList = rec.recPro;
                // genrePro = rec.genrePro;
                // genres = rec.genres;
                // numOfGen = genres.size;
                // setPara(genres);
                // console.log(genres);
                // // change(randomData());
                // var sliderarea = document.getElementById("sliderarea");
                // sliderarea.innerHTML = "";

                // var recarea = document.getElementById("recarea");
                // loadSliders(numOfGen, sliderarea, 'slider');
                // document.documentElement.innerHTML = data;
                $("#sliderarea").html("");
                $("#recarea").html("");
                $("#piechart").html("");
                executeScript(data);
                // $("html").html(data);


            }
            , error: function(jqXHR, textStatus, err){
                alert('text status '+textStatus+', err '+err)
                }
        })
    }); 

});