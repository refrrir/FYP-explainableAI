var svg = d3.select("#piechart")
	.append("svg")
	.append("g");

svg.append("g")
	.attr("class", "slices");
svg.append("g")
	.attr("class", "labels");
svg.append("g")
	.attr("class", "lines");

var width = 600,
	height = 400,
	radius = Math.min(width, height) / 2;

var pie = d3.layout.pie()
	.sort(null)
	.value(function (d) {
		return d.value;
	});

var arc = d3.svg.arc()
	.outerRadius(radius * 0.8)
	.innerRadius(radius * 0.4);

var outerArc = d3.svg.arc()
	.innerRadius(radius * 0.9)
	.outerRadius(radius * 0.9);

svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var key = function (d) { return d.data.label; };


var genre_score = new Map();

function setPara(a) {
	console.log(a);
	genre_score = a;
	var i = 0;
	var genres = new Array();
	for (let key in a) {
		genres[i] = (String(key));
		i++;
	}
	color = d3.scale.ordinal()
		.domain(genres)
		.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00","#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
}

function getPara(){
	return genre_score;
}

function loadAll(numOfGen, numOfRec) {
	loadSliders(numOfGen)
}



function loadSliders(num, sliderarea, id) {
	var sortable = [];
	for (var score in genre_score) {
		sortable.push([score, genre_score[score]]);
	}

	sortable.sort(function(a, b) {
		return b[1] - a[1];
	});


	for (let key in genre_score) {
		var slidecontainer = document.createElement("div");
		// var sliderarea = document.getElementById("sliderarea");
		slidecontainer.class = 'slidecontainer';
		var text = document.createElement("label");
		text.innerHTML = genreName.get(key);
		text.classList.add('genre-name');
		var slider = document.createElement("input");
		slider.type = 'range';
		slider.min = '1';
		slider.max = '100';
		slider.value = genre_score[key] * 80 / sortable[0][1];
		slider.classList.add('slider');
		slider.classList.add('slider2');
		if (id != '') {
			slider.id = id + " " + key;
		}
		// console.log(key,map.get(key));
		slidecontainer.classList.add("row");
		slidecontainer.appendChild(text);
		slidecontainer.appendChild(slider);
		sliderarea.appendChild(slidecontainer);	
	}
}

function loadSliders2(data, sliderarea, id) {
	for (var key in data) {
		var slidecontainer = document.createElement("div");
		// var sliderarea = document.getElementById("sliderarea");
		slidecontainer.class = 'slidecontainer';
		var text = document.createElement("label");
		text.classList.add('genre-name');
		text.innerHTML = genreName.get(key);
		var slider = document.createElement("input");
		slider.type = 'range';
		slider.min = '0';
		slider.max = '100';
		slider.value = data[key] * 100;
		// console.log(data);
		// slider.classList.add('col-8');
		slider.classList.add('slider');
		if (id != '') {
			slider.id = id + " " + key;
		}
		// console.log(key,map.get(key));
		slidecontainer.classList.add("row");
		slidecontainer.classList.add("movieslider");
		slidecontainer.appendChild(text);
		slidecontainer.appendChild(slider);
		sliderarea.appendChild(slidecontainer);	
	}
}

function randomData() {
	var labels = color.domain();
	console.log(genre_score);
	return labels.map(function (label) {
		return { label: genreName.get(label), value: genre_score[label] }
	});
}




function change(data) {
	/* ------- PIE SLICES -------*/
	var slice = svg.select(".slices").selectAll("path.slice")
		.data(pie(data), key);

	slice.enter()
		.insert("path")
		.style("fill", function (d) { return color(d.data.label); })
		.attr("class", "slice");

	slice
		.transition().duration(1000)
		.attrTween("d", function (d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				return arc(interpolate(t));
			};
		})

	slice.exit()
		.remove();

	/* ------- TEXT LABELS -------*/

	var text = svg.select(".labels").selectAll("text")
		.data(pie(data), key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
		.text(function (d) {
			return d.data.label;
		});

	function midAngle(d) {
		return d.startAngle + (d.endAngle - d.startAngle) / 2;
	}

	text.transition().duration(1000)
		.attrTween("transform", function (d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate(" + pos + ")";
			};
		})
		.styleTween("text-anchor", function (d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start" : "end";
			};
		});

	text.exit()
		.remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	var polyline = svg.select(".lines").selectAll("polyline")
		.data(pie(data), key);

	polyline.enter()
		.append("polyline");

	polyline.transition().duration(1000)
		.attrTween("points", function (d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [arc.centroid(d2), outerArc.centroid(d2), pos];
			};
		});

	polyline.exit()
		.remove();
};


