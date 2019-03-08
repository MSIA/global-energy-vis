 function draw() { // Set SVG size
  const margin = ({ top: 20, right: 20, bottom: 30, left: 40 });
  const MainDiv = d3.select('#chart');

  let height = parseInt($(window).height()) * 0.75;
  $('.sidebox').css('height', height);
  let width = parseInt(MainDiv.style('width')) - margin.left - margin.right;

  const Legend = d3.select('#toggles')
    .append('div').attr("class", "legend");

  let xScale = d3.scaleLinear()
    .range([0, width]);
  let yScale = d3.scaleLinear()
    .range([height, 0]);

  let color = d3.scaleOrdinal(d3.schemeSet2);
  const formatAsNumber = d3.format(".0f");
  const formatAsDecimal = d3.format(".2f");
  const formatAsCurrency = d3.format("$.2f");
  const formatAsFloat = d => (d % 1 !== 0) ? d3.format(".2f")(d) : d3.format(".0f")(d);
  const formatAsYear = d3.format("");

  let xFormatter = formatAsYear;
  let yFormatter = formatAsFloat;

  // Define xAxis and yAxis, will define associated scales inside ready function
  let xAxis = d3.axisBottom(xScale)
    .tickFormat(xFormatter);
  let yAxis = d3.axisLeft(yScale)
    .tickFormat(yFormatter);

  // Load data and build chart on ready
  d3.csv('../../data/energy_full.csv').then(ready)
    .catch(e => console.error(e));

  function ready(data) {
    // console.log(data)
    data = data.filter(d => d.Country == Country)

    // Reformat data
    data = data.map(d => {
      return {
        Year: +d.Year,
        co2_milTon: d.co2_milTon ? +d.co2_milTon : null,
        primary_con_mtoe: +d.primary_con_mtoe,
        elec_gen_twh: d.elec_gen_twh ? +d.elec_gen_twh : null,
        hydro_gen_twh: +d.hydro_gen_twh
      }
    })

    // Extract list of years
    let years = data.map(d => d.Year);
    window.data = data;
    console.log(data);

    // Specify data to be used on chart
    const xName = 'Year';
    const yNames = {
      'CO2': { column: 'co2_milTon' },
      'Consumption': { column: 'primary_con_mtoe' },
      'Electric': { column: 'elec_gen_twh' },
      'Hydro': { column: 'hydro_gen_twh' }
    };

    // Each series will be stored as an object in groupObjs
    // complete with data and key elements
    let groupObjs = {};

    let yName, cY; // iterators to be used throughout

    // Will return a list of accessors for each series being charted
    function getYFuncts() {
      let yFuncts = [];
      for (yName in groupObjs) {
        if (groupObjs[yName].visible == true) {
          yFuncts.push(groupObjs[yName].yFunct);
        }
      }
      return yFuncts;
    }

    // Get the global maximum across all y values on chart
    function getYMax() {
      return d3.max(getYFuncts().map(function (fn) {
        return d3.max(data, fn);
      }))
    }

    // Accessor for x dimension
    let xFunct = d => d[xName];
    bisectYear = d3.bisector(xFunct).left;

    // Creates an accessor function for a series
    function getYFn(column) {
      return (d) => d[column];
    }

    // Create a "group object" for each series
    for (yName in yNames) {
      groupObjs[yName] = {
        yFunct: getYFn(yNames[yName].column),
        visible: true,
        objs: {}
      };
    }

    // Adjust scales to available data
    xScale.domain(d3.extent(data, xFunct));
    yScale.domain([0, getYMax()]);

    // Access and scale the data for particular series
    function getYScaleFn(yName) {
      return function (d) {
        return yScale(groupObjs[yName].yFunct(d));
      };
    }
    // Create lines (as series)
    for (yName in yNames) {
      cY = groupObjs[yName];
      cY.objs.line = { g: null, series: null };
      cY.objs.line.series = d3.line()
        .defined(d => d != null)
        // .curve(d3.curveCardinal)
        .x(d => xScale(xFunct(d)))
        .y(getYScaleFn(yName));
    }

    // MainDiv.style("max-width", width + "px");
    // Add all the divs to make it centered and responsive
    MainDiv.append("div")
      .attr("class", "inner-wrapper")
      .style("padding-bottom", (height / width) * 100 + "%")
      .append("div").attr("class", "outer-box")
      .append("div").attr("class", "inner-box");
    const ChartDiv = d3.select('#chart .inner-box');
    d3.select(window).on('resize.' + '#chart .inner-box', update);
    const svg = ChartDiv.append('svg')
      .attr('class', 'chart-area')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define xAxisGroup and yAxisGroup. Will call the appropriate axis within ready function
    let xAxisGroup = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height})`);
    let yAxisGroup = svg.append("g")
      .attr("class", "y axis");

    // Pass scales to axes
    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    window.go = groupObjs
    // Begin render
    // Draw paths for each line series
    for (yName in groupObjs) {
      cY = groupObjs[yName];
      cY.objs.g = svg.append("g");
      cY.objs.line.g = cY.objs.g.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", cY.objs.line.series)
        .style("stroke", color(yName))
        .attr("data-series", yName)
        .on("mouseover", function () {
          Tooltip.style("display", null);
        }).on("mouseout", function () {
          Tooltip.transition().delay(700).style("display", "none");
        }).on("mousemove", mouseHover);
      cY.objs.legend = {};
      cY.objs.legend.div = Legend.append('div').attr('class', 'legend-button').on("click", getToggleFn(yName));
      cY.objs.legend.icon = cY.objs.legend.div.append('div')
        .attr("class", "series-marker")
        .style("background-color", color(yName));
      cY.objs.legend.title = cY.objs.legend.div.append('h4').text(yName);
      cY.objs.legend.description = cY.objs.legend.div.append('p').text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam rhoncus felis eget tempor pharetra. Pellentesque vitae condimentum sapien. Sed nec lectus fringilla, elementum justo eu, ultricies turpis.');
    }

    const Tooltip = svg.append('g').attr('class', 'tool').style('display', 'none');
    Tooltip.append('text')
      .attr('class', 'year')
      .attr('x', 9)
      .attr('y', 7);
    Tooltip.append('line')
      .attr('class', 'line')
      .attr('y1', 0)
      .attr('y2', height);

    // Draw tooltips
    for (yName in groupObjs) {
      cY = groupObjs[yName];
      //Add tooltip elements
      let tooltip = Tooltip.append("g");
      cY.objs.circle = tooltip.append("circle")
        .attr("r", 7.5)
        .style('fill', color(yName));
      cY.objs.rect = tooltip.append("rect")
        .attr("x", 9).attr("y", "-5")
        .attr("width", 50)
        .attr("height", '0.75em');
      cY.objs.text = tooltip.append("text")
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("class", "value");
      cY.objs.tooltip = tooltip;
    }

    // Add overlay to watch for hover
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style('fill', 'none')
      .on("mouseover", function () {
        Tooltip.style("display", null);
      }).on("mouseout", function () {
        Tooltip.style("display", "none");
      }).on("mousemove", mouseHover);

    function toggleSeries(yName) {
      cY = groupObjs[yName];
      cY.visible = !cY.visible;
      if (cY.visible == false) { cY.objs.legend.div.style("opacity", "0.3") }
      else { cY.objs.legend.div.style("opacity", "1") }
      update()
    }

    function getToggleFn(series) {
      return function () {
        return toggleSeries(series);
      };
    }

    function update() {
      width = parseInt(ChartDiv.style('width'), 10) - (margin.left + margin.right);
      // height = parseInt(ChartDiv.style('height'), 10) - (margin.top + margin.bottom);
console.log(width, height)
      xScale.range([0, width]);
      yScale.range([height, 0]).domain([0, getYMax()]);

      if (!svg) { console.error('No SVG'); return false; }

      // Update axes
      xAxisGroup.attr('transform', `translate(0, ${height})`).call(xAxis);
      // chart.objs.axes.g.select('.x.axis .label').attr('x', chart.width / 2);
      yAxisGroup.call(yAxis);
      // chart.objs.axes.g.select('.y.axis .label').attr('x', -chart.height / 2);

      // Update lines and tooltips
      for (yName in groupObjs) {
        cY = groupObjs[yName];
        if (cY.visible) {
          cY.objs.line.g.attr('d', cY.objs.line.series).style('display', null);
          cY.objs.tooltip.style('display', null);
        } else {
          cY.objs.line.g.style("display", "none");
          cY.objs.tooltip.style("display", "none");
        }
      }

      Tooltip.select('.line').attr('y2', height);

      ChartDiv.select('svg')
        .attr('width', width + (margin.left + margin.right))
        .attr('height', height + (margin.top + margin.bottom));

      svg.select('.overlay').attr('width', width).attr('height', height);
    }

    function mouseHover() {
      let x0 = xScale.invert(d3.mouse(this)[0]),
        i = bisectYear(data, x0, 1),
        d0 = data[i - 1], d1 = data[i];
      let d = x0 - xFunct(d0) > xFunct(d1) - x0 ? d1 : d0;
      let minY = height;
      for (yName in groupObjs) {
        cY = groupObjs[yName];
        if (cY.visible == false) { continue }
        //Move the tooltip
        cY.objs.tooltip.attr("transform", "translate(" + xScale(xFunct(d)) + "," + yScale(cY.yFunct(d)) + ")");
        //Change the text
        cY.objs.tooltip.select("text").text(yFormatter(cY.yFunct(d)));
        minY = Math.min(minY, yScale(cY.yFunct(d)));
      }

      Tooltip.select(".tool .line").attr("transform", "translate(" + xScale(xFunct(d)) + ")").attr("y1", minY);
      Tooltip.select(".tool .year").text("Year: " + xFormatter(xFunct(d)));
    }
  }
 }