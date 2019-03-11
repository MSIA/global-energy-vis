var startYearPrev = 1901;
var endYearPrev = 1901;
var currentKey;
var currentLabel;
var currentKeyPrev = '';
var currentYear;
var startYear;
var endYear;
var geo_data;
var full_data;
var full_data2;
var full_cur;
var minE;
var maxE;
var intColor2;

var numberFormat = d3.format(',.2f');

d3.select('#select-key').on('change', function(a) {
  currentKey = d3.select(this).property('value');
  currentLabel = d3.select(this).property('value'); //find a way to find the name instead of the value property

  ready(currentKey, currentYear);
});

// Set tooltips
var tip = d3
  .tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return (
      "<strong>Country: </strong><span class='details'>" +
      d.properties.name +
      '<br></span>' +
      '<strong>' +
      currentLabel +
      ": </strong><span class='details'>" +
      numberFormat(d.currentKey) +
      '</span>'
    );
  });

var margin = { top: 40, right: 20, bottom: 40, left: 20 };
var width = document.getElementById('map').clientWidth - margin.left - margin.right;
var height = width / 5 * 3 - margin.top - margin.bottom;

d3.select('#play-button').style('top', height);

var path = d3.geoPath();

var svg = d3
  .select('#mapBox')
  .attr('width', width)
  .attr('height', height)
  .append('g')
		.attr('class', 'map')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

var projection = d3
  .geoMercator()
  .scale(140)
  .translate([width / 2.5, height / 2 + 100]); // 1.5) + 100]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

//SLIDERBeg//

let slideWidth = width * 4 / 5;
var svgslider = d3
  .select('#vis')
  .append('svg')
  .attr('width', slideWidth)
	.attr('height', 50)
	.style('cursor', 'pointer');

////////// slider //////////

var moving = false;
var currentYear = startYear;
var currentValue = 0;
var targetValue = slideWidth - 20;

var playButton = d3.select('#play-button');

x = d3
  .scaleLinear()
  .range([0, targetValue])
  .clamp(true);

var slider = svgslider
  .append('g')
  .attr('class', 'slider')
	.attr('transform', `translate(10, 10)`);

playButton.on('click', function() {
  var button = d3.select(this);
  if (button.text() == 'Pause') {
    moving = false;
    clearInterval(timer);
    button.text('Play');
  } else {
    moving = true;
    currentValue = 0;
    timer = setInterval(step, 200);
    button.text('Pause');
  }
});

function update(h) {
  // update position and text of label according to slider scale
  handle.attr('cx', x(h));
  // filter data set and redraw plot
  currentYear = Math.round(h);
  ready(currentKey, currentYear);
}

function step() {
  update(x.invert(currentValue));
  currentValue = currentValue + targetValue / (endYear - startYear);

  if (currentValue > targetValue) {
    moving = false;
    currentValue = 0;
    clearInterval(timer);
    // timer = 0;
    playButton.text('Play');
  }
}

slider
  .append('line')
  .attr('class', 'track')
  .attr('x1', x.range()[0])
  .attr('x2', x.range()[1])
  .select(function() {
    return this.parentNode.appendChild(this.cloneNode(true));
  })
  .attr('class', 'track-inset')
  .select(function() {
    return this.parentNode.appendChild(this.cloneNode(true));
  })
  .attr('class', 'track-overlay');
var handle = slider
  .append('circle', '.track-overlay')
  .attr('class', 'handle')
  .attr('r', 9);

//SLIDEREnd//

function first_func(ndata, full) {
  geo_data = ndata;
  full_data = full;
  currentKey = 'Pop_T';
  currentYear = 0;
  currentLabel = 'Population';

  svg
    .append('g')
    .attr('class', 'countries')
    .selectAll('path')
    .data(geo_data.features)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', '#eee')
    .style('stroke', 'white')
    .style('stroke-width', 1.5);

  svg
    .append('path')
    .datum(
      topojson.mesh(ndata.features, function(a, b) {
        return a.id !== b.id;
      })
    )
    .attr('class', 'names')
    .attr('d', path);

  full_data.forEach(function(d) {
    d.Year = +d.Year;
  });
  ready(currentKey, currentYear);
}

function ready(currentKey, currentYear) {
  if (currentKey != currentKeyPrev) {
    full_cur = full_data.filter(d => d[currentKey] > 0);
    startYear = d3.min(full_cur, function(d) {
      return +d.Year;
    });
    endYear = d3.max(full_cur, function(d) {
      return +d.Year;
    });

    currentKeyPrev = currentKey;

    minE = d3.min(full_cur, function(d) {
      return +d[currentKey];
    });
    maxE = d3.max(full_cur, function(d) {
      return +d[currentKey];
    });
    intColor2 = d3
      .scaleSequential(d3.interpolateReds)
      .domain([Math.log(minE), Math.log(maxE)]);
    //.domain([Math.cbrt(minE), Math.cbrt(maxE)]);
    //.domain([minE, maxE]);
  }

  if (currentYear == 0) {
    currentYear = startYear;
  }

  if ((startYear != startYearPrev) | (endYear != endYearPrev)) {
    x.domain([startYear, endYear]);

    /*
					x.domain([startYear, endYear])
					 .range([0, targetValue])
					 .clamp(true);

					slider.append("line")
							.attr("class", "track")
							.attr("x1", x.range()[0])
							.attr("x2", x.range()[1])
							.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
							.attr("class", "track-inset")
							.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
							.attr("class", "track-overlay")
		*/
    d3.selectAll('#sliderTick').remove();
    slider
      .insert('g', '.track-overlay')
      .attr('id', 'sliderTick')
      .attr('class', 'ticks')
      .attr('transform', 'translate(0,' + 18 + ')')
      .selectAll('text')
      .data(x.ticks(endYear - startYear + 1))
      .enter()
      .append('text')
      .attr('x', x)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return d;
      })
      .attr('font-size', '8px');

    startYearPrev = startYear;
    endYearPrev = endYear;
  }

  slider.call(
    d3
      .drag()
      .on('start.interrupt', function() {
        slider.interrupt();
      })
      .on('start drag', function() {
        currentValue = d3.event.x;
				// console.log(currentValue);
				console.log(d3.event.x);
        console.log(x.invert(currentValue));
        update(x.invert(currentValue));
      })
  );

  var usageById = {};
  var lusageById = {};
  full_data2 = full_cur.filter(d => d.Year == currentYear);

  full_data2.forEach(function(d) {
    usageById[d.Code] = +d[currentKey];
  });

  //geo_data.features.forEach(function(d) { d[currentKey] = usageById[d.id] });
  geo_data.features.forEach(function(d) {
    d.currentKey = usageById[d.id];
  });

  full_data2.forEach(function(d) {
    lusageById[d.Code] = Math.log(+d[currentKey]);
  });

  svg
    .selectAll('path')
    .data(geo_data.features)
    .style('fill', function(d) {
      if (lusageById[d.id] > 0) {
        return intColor2(lusageById[d.id]);
      } else {
        return '#eee';
      }
    })
    .style('stroke', 'white')
    .style('stroke-width', 0.3)
    .on('mouseover', function(d) {
      if (d.currentKey > 0) {
        tip.show(d);
        d3.select(this)
          .style('stroke', 'white')
          .style('stroke-width', 3);
      }
    })
    .on('mouseout', function(d) {
      tip.hide(d);
      d3.select(this)
        .style('stroke', 'white')
        .style('stroke-width', 0.3);
		})
		.on('click', d => window.open(`/trends/${d.id}`));
}

Promise.all([
  d3.json('http://enjalot.github.io/wwsd/data/world/world-110m.geojson'),
  d3.csv('/data/full.csv')
]).then(function(data) {
  first_func(data[0], data[1]);
});
