function makeLineChart(dataset, xName, yNames) {
  let chart = {};
  chart.data = dataset;
  chart.xName = xName;
  chart.yNames = yNames;
  chart.groupObjs = {};
  chart.objs = {
    mainDiv: null, chartDiv: null, g: null,
    xAxis: null, yAxis: null, tooltip: null, legend: null
  };

  let colorFunct = d3.scaleOrdinal(d3.schemeCategory10);
  function updateColorFunction(colorOptions) {
    /*
     * Takes either a list of colors, a function or an object with the mapping already in place
     * */
    if (typeof colorOptions == 'function') {
      return colorOptions
    } else if (Array.isArray(colorOptions)) {
      //  If an array is provided, map it to the domain
      var colorMap = {}, cColor = 0;
      for (var cName in chart.groupObjs) {
        colorMap[cName] = colorOptions[cColor];
        cColor = (cColor + 1) % colorOptions.length;
      }
      return function (group) {
        return colorMap[group];
      }
    } else if (typeof colorOptions == 'object') {
      // if an object is provided, assume it maps to  the colors
      return function (group) {
        return colorOptions[group];
      }
    }
  }

  chart.formatAsNumber = d3.format(".0f");
  chart.formatAsDecimal = d3.format(".2f");
  chart.formatAsCurrency = d3.format("$.2f");
  chart.formatAsFloat = function (d) { if (d % 1 !== 0) { return d3.format(".2f")(d); } else { return d3.format(".0f")(d); } };
  chart.formatAsYear = d3.format("");

  chart.xFormatter = chart.formatAsNumber;
  chart.yFormatter = chart.formatAsFloat;

  function getYFuncts() {
    let yFuncts = [];
    for (let yName in chart.groupObjs) {
      currGroup = chart.groupObjs[yName];
      if (currGroup.visible == true) {
        yFuncts.push(currGroup.yFunct);
      }
    }
    return yFuncts;
  }

  function getYMax() {
    return d3.max(getYFuncts().map(function (fn) {
      return d3.max(chart.data, fn);
    }))
  }

  function prepareData() {
    chart.xFunct = function (d) { return d[xName] };
    chart.bisectYear = d3.bisector(chart.xFunct).left;

    let yName, cY;
    for (yName in chart.yNames) {
      chart.groupObjs[yName] = { yFunct: null, visible: null, objs: {} };
    }

    function getYFn(column) {
      return function (d) {
        return d[column];
      };
    }

    chart.yFuncts = [];
    for (yName in chart.yNames) {
      cY = chart.groupObjs[yName];
      cY.visible = true;
      cY.yFunct = getYFn(chart.yNames[yName].column)
    }
  }
  prepareData();

  chart.update = function () {
    chart.width = parseInt(chart.objs.chartDiv.style('width'), 10) - (chart.margin.left + chart.margin.right);
    chart.height = parseInt(chart.objs.chartDiv.style('height'), 10) - (chart.margin.top + chart.margin.bottom);

    chart.xScale.range([0, chart.width]);
    chart.yScale.range([chart.height, 0]).domain([0, getYMax()]);

    if (!chart.objs.g) { return false; }

    chart.objs.axes.g.select('.x.axis').attr('transform', `translate(0, ${chart.height})`).call(chart.objs.xAxis);
    chart.objs.axes.g.select('.x.axis .label').attr('x', chart.width / 2);
    chart.objs.axes.g.select('.y.axis').call(chart.objs.yAxis);
    chart.objs.axes.g.select('.y.axis .label').attr('x', -chart.height / 2);

    for (var yName in chart.groupObjs) {
      cY = chart.groupObjs[yName];
      if (cY.visible) {
        cY.objs.line.g.attr('d', cY.objs.line.series).style('display', null);
        cY.objs.tooltip.style('display', null);
      } else {
        cY.objs.line.g.style("display", "none");
        cY.objs.tooltip.style("display", "none");
      }
    }

    chart.objs.tooltip.select('.line').attr('y2', chart.height);

    chart.objs.chartDiv.select('svg')
      .attr('width', chart.width + (chart.margin.left + chart.margin.right))
      .attr('height', chart.height + (chart.margin.top + chart.margin.bottom));

    chart.objs.g.select('.overlay').attr('width', chart.width).attr('height', chart.height);

    return chart;
  };

  chart.bind = function (bindOptions) {
    console.log(bindOptions);
    function getOptions() {
      if (!bindOptions) throw "Missing Bind Options";

      if (bindOptions.selector) {
        chart.objs.mainDiv = d3.select(bindOptions.selector);
        chart.selector = bindOptions.selector + ' .inner-box';
      } else throw "No Selector Provided";

      if (bindOptions.margin) {
        chart.margin = margin;
      } else {
        chart.margin = { top: 15, right: 60, bottom: 30, left: 50 };
      }
      if (bindOptions.chartSize) {
        chart.divWidth = bindOptions.chartSize.width;
        chart.divHeight = bindOptions.chartSize.height;
      } else {
        chart.divWidth = 800;
        chart.divHeight = 400;
      }

      chart.width = chart.divWidth - chart.margin.left - chart.margin.right;
      chart.height = chart.divHeight - chart.margin.top - chart.margin.bottom;

      if (bindOptions.axisLabels) {
        chart.xAxisLabel = bindOptions.axisLabels.xAxis;
        chart.yAxisLabel = bindOptions.axisLabels.yAxis;
      } else {
        chart.xAxisLabel = chart.xName;
        chart.yAxisLabel = chart.yNames[0];
      }

      if (bindOptions.colors) {
        colorFunct = updateColorFunction(bindOptions.colors);
      }
    }

    getOptions();

    chart.xScale = d3.scaleLinear()
      .range([0, chart.width])
      .domain(d3.extent(chart.data, chart.xFunct));

    chart.yScale = d3.scaleLinear()
      .range([chart.height, 0])
      .domain([0, getYMax()]);

    chart.objs.xAxis = d3.axisBottom(chart.xScale)
      .tickFormat(chart.xFormatter);
    chart.objs.yAxis = d3.axisLeft(chart.yScale)
      .tickFormat(chart.yFormatter);

    // Build line building functions
    function getYScaleFn(yName) {
      return function (d) {
        return chart.yScale(chart.groupObjs[yName].yFunct(d));
      };
    }
    // Create lines (as series)
    for (var yName in yNames) {
      var cY = chart.groupObjs[yName];
      cY.objs.line = { g: null, series: null };
      cY.objs.line.series = d3.line()
        .curve(d3.curveCardinal)
        .x(function (d) { return chart.xScale(chart.xFunct(d)); })
        .y(getYScaleFn(yName));
    }
    chart.objs.mainDiv.style("max-width", chart.divWidth + "px");
    // Add all the divs to make it centered and responsive
    chart.objs.mainDiv.append("div")
      .attr("class", "inner-wrapper")
      .style("padding-bottom", (chart.divHeight / chart.divWidth) * 100 + "%")
      .append("div").attr("class", "outer-box")
      .append("div").attr("class", "inner-box");
      console.log('resize.' + chart.selector)
    chart.objs.chartDiv = d3.select(chart.selector);
    d3.select(window).on('resize.' + chart.selector, chart.update);
    chart.objs.g = chart.objs.chartDiv.append('svg')
      .attr('class', 'chart-area')
      .attr('width', chart.width + (chart.margin.left + chart.margin.right))
      .attr('height', chart.height + (chart.margin.top + chart.margin.bottom))
      .append('g')
      .attr('transform', `translate(${chart.margin.left}, ${chart.margin.top})`);

    chart.objs.axes = {};
    chart.objs.axes.g = chart.objs.g.append('g').attr('class', 'axis');

    chart.objs.axes.x = chart.objs.axes.g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${chart.height})`)
      .call(chart.objs.xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('x', chart.width / 2)
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .text(chart.xAxisLabel);

    chart.objs.axes.y = chart.objs.axes.g.append('g')
      .attr('class', 'y axis')
      .call(chart.objs.yAxis)
      .append('text')
      .attr('class', 'label')
      .attr("transform", "rotate(-90)")
      .attr("y", -42)
      .attr("x", -chart.height / 2)
      .attr("dy", ".71em")
      .style("text-anchor", "middle")
      .text(chart.yAxisLabel);

    return chart;
  }
  chart.render = function () {

    var yName, cY = null;

    chart.objs.legend = d3.select('#toggles').append('div').attr("class", "legend");

    function toggleSeries(yName) {
      cY = chart.groupObjs[yName];
      cY.visible = !cY.visible;
      if (cY.visible == false) { cY.objs.legend.div.style("opacity", "0.3") } else { cY.objs.legend.div.style("opacity", "1") }
      chart.update()
    }
    function getToggleFn(series) {
      return function () {
        return toggleSeries(series);
      };
    }
    for (yName in chart.groupObjs) {
      cY = chart.groupObjs[yName];
      cY.objs.g = chart.objs.g.append("g");
      cY.objs.line.g = cY.objs.g.append("path")
        .datum(chart.data)
        .attr("class", "line")
        .attr("d", cY.objs.line.series)
        .style("stroke", colorFunct(yName))
        .attr("data-series", yName)
        .on("mouseover", function () {
          tooltip.style("display", null);
        }).on("mouseout", function () {
          tooltip.transition().delay(700).style("display", "none");
        }).on("mousemove", mouseHover);

      cY.objs.legend = {};
      cY.objs.legend.div = chart.objs.legend.append('div').on("click", getToggleFn(yName));
      cY.objs.legend.icon = cY.objs.legend.div.append('div')
        .attr("class", "series-marker")
        .style("background-color", colorFunct(yName));
      cY.objs.legend.text = cY.objs.legend.div.append('p').text(yName);

    }

    // Draw tooltips
    // There must be a better way so we don't need a second loop. Issue is draw order so tool tips are on top
    chart.objs.tooltip = chart.objs.g.append("g").attr("class", "tooltip").style("display", "none");
    // Year label
    chart.objs.tooltip.append("text").attr("class", "year").attr("x", 9).attr("y", 7);
    // Focus line
    chart.objs.tooltip.append("line").attr("class", "line").attr("y1", 0).attr("y2", chart.height);

    for (yName in chart.groupObjs) {
      cY = chart.groupObjs[yName];
      //Add tooltip elements
      var tooltip = chart.objs.tooltip.append("g");
      cY.objs.circle = tooltip.append("circle").attr("r", 5);
      cY.objs.rect = tooltip.append("rect").attr("x", 8).attr("y", "-5").attr("width", 22).attr("height", '0.75em');
      cY.objs.text = tooltip.append("text").attr("x", 9).attr("dy", ".35em").attr("class", "value");
      cY.objs.tooltip = tooltip;
    }

    // Overlay to capture hover
    chart.objs.g.append("rect")
      .attr("class", "overlay")
      .attr("width", chart.width)
      .attr("height", chart.height)
      .style('fill', 'none')
      .on("mouseover", function () {
        chart.objs.tooltip.style("display", null);
      }).on("mouseout", function () {
        chart.objs.tooltip.style("display", "none");
      }).on("mousemove", mouseHover);

    return chart;
  }



  function mouseHover() {
    var x0 = chart.xScale.invert(d3.mouse(this)[0]), i = chart.bisectYear(dataset, x0, 1), d0 = chart.data[i - 1], d1 = chart.data[i];
    try {
      var d = x0 - chart.xFunct(d0) > chart.xFunct(d1) - x0 ? d1 : d0;
    } catch (e) { return; }
    var minY = chart.height;
    var yName, cY;
    for (yName in chart.groupObjs) {
      cY = chart.groupObjs[yName];
      if (cY.visible == false) { continue }
      //Move the tooltip
      cY.objs.tooltip.attr("transform", "translate(" + chart.xScale(chart.xFunct(d)) + "," + chart.yScale(cY.yFunct(d)) + ")");
      //Change the text
      cY.objs.tooltip.select("text").text(chart.yFormatter(cY.yFunct(d)));
      minY = Math.min(minY, chart.yScale(cY.yFunct(d)));
    }

    chart.objs.tooltip.select(".tooltip .line").attr("transform", "translate(" + chart.xScale(chart.xFunct(d)) + ")").attr("y1", minY);
    chart.objs.tooltip.select(".tooltip .year").text("Year: " + chart.xFormatter(chart.xFunct(d)));
  }

  return chart;
}