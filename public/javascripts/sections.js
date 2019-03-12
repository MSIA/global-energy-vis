let scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  let width = 600;
  let height = 520;
  let margin = { top: 0, left: 40, bottom: 40, right: 10 };

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  let lastIndex = -1;
  let activeIndex = 0;

  // main svg used for visualization
  let svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  let g = null;

  // Setup scales for line chart
  let xScaleLine = d3.scaleLinear()
    .range([0, width]);

  let yScaleLine = d3.scaleLinear()
    .range([height, 0]);

  let xAxisLine = d3.axisBottom()
    .scale(xScaleLine);
  let yAxisLine = d3.axisLeft()
    .scale(yScaleLine);
  // When scrolling to a new section
  // the activation function for that
  // section is called.
  let activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  let updateFunctions = [];

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  let chart = function (selection) {
    selection.each(function (rawData) {
      // create svg and give it a width and height
      svg = d3.select(this).append('svg');
      svg.attr('class', 'SVG');
      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      // this group element will be used to contain all
      // other elements.
      g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('id', 'canvas');
      let country = 'India';
      let metric = 'co2_milton';

      let countryData = getCountryData(rawData, country);

      xScaleLine.domain(d3.extent(countryData, d => d.Year));
      yScaleLine.domain(d3.extent(countryData, d => d[metric]));

      setupVis(countryData, metric);

      setupSections();
    });
  };

  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param wordData - data object for each word.
   * @param fillerCounts - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  let setupVis = function (countryData, metric) {
    // x axis line chart
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxisLine);
    g.select('.x.axis').style('opacity', 0);
    // y axis line chart
    g.append('g')
      .attr('class', 'y axis')
      .call(yAxisLine);
    g.select('.y.axis').style('opacity', 0);

    // count openvis title
    g.append('text')
      .attr('class', 'title energy-title')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('Warming Up');

    g.append('text')
      .attr('class', 'sub-title energy-title')
      .attr('x', width / 2)
      .attr('y', (height / 3) + (height / 5))
      .text('To New Energies');

    g.selectAll('.energy-title')
      .attr('opacity', 0);

    // count filler word count title
    g.append('text')
      .attr('class', 'title percent-title highlight')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('Less than 16%');

    let tmp = g.append('text')
      .attr('class', 'sub-title percent-title')
      .attr('x', width / 2)
      .attr('y', (height / 3));
    tmp.append('tspan').text('Of total consumption').attr('x', width / 2).attr('dy', '1.2em');
    tmp.append('tspan').text('is from renewables').attr('x', width / 2).attr('dy', '1.2em');

    g.selectAll('.percent-title')
      .attr('opacity', 0);

    // linechart
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    let line = d3.line()
      .curve(d3.curveNatural)
      .x(d => xScaleLine(d.Year))
      .y(d => yScaleLine(d[metric]));
    let path = g.append('path')
      .attr('class', 'trendline')
      .attr('d', line(countryData))
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    let totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .attr('id', 'trendline-path');


    g.append('image')
      .attr('class', 'image')
      .attr('xlink:href', 'images/earth-lights.jpg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .attr('opacity', 0);
  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  let setupSections = function () {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showPercent;
    activateFunctions[2] = showLineChart;
    activateFunctions[3] = showImage;
    activateFunctions[4] = showLast;
    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (let i = 0; i < 6; i++) {
      updateFunctions[i] = function () { };
    }
    updateFunctions[1] = updatePercent;
    updateFunctions[2] = updateLine;
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * (no previous step to hide)
   * hides: percent title
   * shows: intro title
   *
   */
  function showTitle() {
    g.selectAll('.percent-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.energy-title')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);
  }

  /**
   * showPercent - Global Percent Renewable
   *
   * hides: intro title
   * hides: line chart
   * shows: percent title
   *
   */
  function showPercent() {
    g.selectAll('.energy-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.trendline')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    hideAxes();

    g.selectAll('.percent-title')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);
  }

  /**
   * showLineChart - trend line for country
   *
   * hides: percent title
   * (no following step to hide)
   * shows: line chart
   *
   */
  function showLineChart() {
    showAxes(xAxisLine, yAxisLine);

    g.selectAll('.percent-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.image')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.trendline')
      .attr('opacity', 1);
  }

  function showImage() {
    console.log('SHOWING IMAGE');
    hideAxes();

    g.selectAll('.trendline')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.image')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);
  }

  function showLast() {
    console.log('FINAL');

    g.selectAll('.image')
      .transition()
      .duration(200)
      .attr('opacity', 0);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param xAxis - the xAxis to show
   * @param yAxis - the yAxis to show
   */
  function showAxes(xAxis, yAxis) {
    g.select('.x.axis')
      .call(xAxis)
      .transition().duration(500)
      .style('opacity', 1);
    g.select('.y.axis')
      .call(yAxis)
      .transition().duration(500)
      .style('opacity', 1);
  }

  /**
   * hideAxes - helper function
   * to hide the axes
   *
   */
  function hideAxes() {
    console.log('HIDING AXES');

    g.selectAll('.axis')
      .transition().duration(200)
      .style('opacity', 0);
  }

  /**
   * UPDATE FUNCTIONS
   *
   * These will be called within a section
   * as the user scrolls through it.
   *
   * We use an immediate transition to
   * update visual elements based on
   * how far the user has scrolled
   *
   */

  /**
   * updatePercent - increase/decrease
   * percent displayed
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updatePercent(progress) {
    g.selectAll('.percent-title')
      .transition()
      .duration(0)
      .attr('opacity', progress);
    g.selectAll('.percent-title.highlight')
      .style('font-size', progress * 120);
  }
  /**
   * updateLine - increase/decrease
   * cough text and color
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateLine(progress) {
    let path = g.select('#trendline-path');

    let totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dashoffset", totalLength - totalLength * progress);
  }

  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

  /**
   * getCountryData - maps raw data to
   * array of data objects. There is
   * one data object for each word in the speach
   * data.
   *
   * This function converts some attributes into
   * numbers and adds attributes used in the visualization
   *
   * @param rawData - data read in from file
   */
  function getCountryData(rawData, country) {
    return rawData.filter(d => d.Country === country)
      .map(function (d, i) {
        d.Year = +d.Year;
        d.co2_milton = +d.co2_milTon;
        // TODO: format rest of metrics used
        return d;
      });
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    let sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function (index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};
/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
  // create a new plot and
  // display it
  let plot = scrollVis();
  d3.select('#vis')
    .datum(data)
    .call(plot);

  // setup scroll functionality
  let scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function (index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });

  scroll.on('progress', function (index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
d3.csv('data/energy_full.csv').then(display);
