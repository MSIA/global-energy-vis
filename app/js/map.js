var currentKey='u2017';
var currentYear=2000;
var startYear = 2000;
var endYear = 2017;



d3.select('#select-key').on('change', function(a) {
  // Change the current key and call the function to update the colors.
  currentKey = d3.select(this).property('value');
  call_promise();
});

var format = d3.format(",");
// The svg
var svg = d3.select("#gradientBox"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

/*
var dintColor = d3.scaleSequential(d3.interpolateReds)
    .domain([d3.min(data, function(d){ return Math.log(d.u2017)}), 9]);
*/
var numberFormat = d3.format(",.2f");
function logFormat(d) {
    var x = Math.log(d) / Math.log(10) + 1e-6;
    return Math.abs(x - Math.floor(x)) < .7 ? numberFormat(d) : "";
 }

var legendWidth = 250;
var legendHeight = 15;
var legendTicks = 4;

// Set tooltips
var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Energy Usage: </strong><span class='details'>" + format(d[currentKey]) +"</span>";
            })

var margin = {top: 40, right: 20, bottom: 40, left: 20},
            width = 1440 - margin.left - margin.right,
            height = 750 - margin.top - margin.bottom;

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(20,500)");

var defs = g.append("defs");

//Append a linearGradient element to the defs and give it a unique id
var linearGradient = defs.append("linearGradient")
						 .attr("id", "linear-gradient");

//Horizontal gradient
linearGradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

//Set the color for the start (0%)
linearGradient.append("stop")
              .attr("offset", "0%")
              .attr("stop-color", "#ffa474"); //light blue

//Set the color for the end (100%)
linearGradient.append("stop")
              .attr("offset", "100%")
              .attr("stop-color", "#8b0000"); //dark blue

//Draw the rectangle and fill with gradient
svg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
	.attr("x",600)
	.attr("y",50)
    .style("fill", "url(#linear-gradient)");

svg.append("text")
	.attr("class", "legendTitle")
	.attr("x", (600+(legendWidth/2)))
	.attr("y", 30)
	.style("text-anchor", "middle")
	.text("Energy Usage");

var path = d3.geoPath();

var svg = d3.select("#mapBox")
            //.append("svg")
            .attr("width", width)
            .attr("height", height)
			.append('g')
			 .attr('class','map');

var projection = d3.geoMercator()
                   .scale(100)
                   .translate( [width / 2, (height / 1.5) + 100]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

//SLIDERBeg//

var svgslider = d3.select("#vis")
    .append("svg")
    .attr("width",4/5 * (width + margin.left + margin.right))
    .attr("height", height);

////////// slider //////////

var moving = false;
var currentYear = startYear;
var currentValue = 0;
var targetValue = width*4/5;

var playButton = d3.select("#play-button");

var x = d3.scaleLinear()
    .domain([startYear, endYear])
    .range([0, targetValue])
    .clamp(true);


var slider = svgslider.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height/5 + ")");


slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() {

		  currentValue = d3.event.x;
          update(x.invert(currentValue));

		  //console.log(x.invert(currentYear));
		  //console.log(currentYear);
		  //console.log(d3.event.x);
        })
    );

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
  .selectAll("text")
    .data(x.ticks(20))
    .enter()
    .append("text")
    .attr("x", x)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .text(function(d) { return d; })
	.attr("font-size","10px");

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

playButton
    .on("click", function() {
    var button = d3.select(this);
    if (button.text() == "Pause") {
      moving = false;
      clearInterval(timer);
      button.text("Play");
    } else {
      moving = true;
	  currentValue = 0;
      timer = setInterval(step, 200);
      button.text("Pause");
    }
    //console.log("Slider moving: " + moving);
  })

  function update(h) {
  // update position and text of label according to slider scale
  handle.attr("cx", x(h));
  //console.log(x(h));
	//console.log(x.invert((currentYear)));
  // filter data set and redraw plot
  currentYear = Math.round(h);
  console.log(currentYear);

  call_promise();

}

function step() {

  //console.log(x.invert(currentYear));
  update(x.invert(currentValue));
  currentValue = currentValue + (targetValue / (endYear - startYear));

  if (currentValue  > targetValue) {
    moving = false;
    currentValue = 0;
    clearInterval(timer);
    // timer = 0;
    playButton.text("Play");
    //console.log("Slider moving: " + moving);
  }
}


//SLIDEREnd//

function ready(ndata, usage, currentKey, currentYear) {

	  var usageById = {};
	  var lusageById = {};

	  usage.forEach(function(d) { d.Year = +d.Year;});

	  usage = usage.filter( d=> d.Year == currentYear);

	  usage.forEach(function(d) { usageById[d.id] = +d[currentKey]; });
	  ndata.features.forEach(function(d) { d[currentKey] = usageById[d.id] });
	  usage.forEach(function(d) {lusageById[d.id] = Math.log(+d[currentKey])});

	  var data = ndata;
    // console.log(lusageById);

	 var minE = d3.min(usage, function(d) { return +d[currentKey]; });
	 var maxE = d3.max(usage, function(d) { return +d[currentKey]; });
   // console.log(minE);

	  var intColor2 = d3.scaleSequential(d3.interpolateReds)
						.domain([Math.log(minE), Math.log(maxE)]);

   //console.log(intColor2(Math.log(minE)));
   //console.log(intColor2(Math.log(maxE)));
	//Set scale for x-axis
	var xScale = d3.scaleLog()
	           .range([-(legendWidth/2), (legendWidth/2)])
	           .domain([Math.log(minE), Math.log(maxE)]);

	var xAxis = d3.axisBottom(xScale)
			  .tickFormat(function(x) {return x % 2 == 0? Math.round(Math.exp(x)) : "";} )
	//Set up X axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate("+(600 + legendWidth/2)+"," + (50 + legendHeight) + ")")
		.call(xAxis);


	//console.log(data.features);
	  svg.append("g")
		  .attr("class", "countries")
		  .selectAll("path")
		  .data(data.features)
		  .enter().append("path")
		  .attr("d", path)
		  .style("fill", function(d){ if(lusageById[d.id] >0) {return intColor2(lusageById[d.id]);} else { return "#eee";}})
		  .style('stroke', 'white')
		  .style('stroke-width', 1.5)
		  .style("opacity",0.8)
		  // tooltips
		  .style("stroke","white")
		  .style('stroke-width', 0.3)
		  .on('mouseover',function(d){
										if(d[currentKey] >0) {
														tip.show(d);
														d3.select(this)
														  .style("opacity", 1)
														  .style("stroke","white")
				                                          .style("stroke-width",3);
		   } })
		  .on('mouseout', function(d){
			  tip.hide(d);
			  d3.select(this)
				.style("opacity", 0.8)
				.style("stroke","white")
				.style("stroke-width",0.3);
			});

	  svg.append("path")
		  .datum(topojson.mesh(data.features, function(a, b) { return a.id !== b.id; }))
		  .attr("class", "names")
		  .attr("d", path);
}

function call_promise() {
Promise.all([
  d3.json("http://enjalot.github.io/wwsd/data/world/world-110m.geojson"),
  d3.csv("/data/Global_Energy_Usage_2.csv"),
  currentKey,
  currentYear
]).then( function(data){ready(data[0], data[1],data[2],data[3])});
}

call_promise();