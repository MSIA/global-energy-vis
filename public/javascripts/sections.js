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

  // Setup rScale for bubbles
  let rScale = d3.scaleLinear()
    .range([0, width / 3]);
  let color = d3.scaleOrdinal(d3.schemeAccent);

  // Setup x for line chart
  let xScaleLine = d3.scaleLinear()
    .range([0, width]);
  let xAxisLine = d3.axisBottom()
    .scale(xScaleLine);

  // Setup x for bar chart
  let xScaleBar = d3.scaleBand()
    .padding([.25])
    .rangeRound([0, width]);
  let xAxisBar = d3.axisBottom().scale(xScaleBar);

  // Setup y scale and axis
  let yScale = d3.scaleLinear()
    .range([height, 0]);
  let yAxis = d3.axisLeft()
    .scale(yScale);

  let pack = d3.pack()
    .size([width, height])
    .padding(1.5);

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
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('id', 'canvas');


      const countryData = getCountryData(rawData[0]);
      const worldData = getWorldData(rawData[1]);
      window.worldData = worldData;
      const barData = [
        { name: 'EQG', renewable: 83.88478497, color: 'orange' },
        { name: 'USA', renewable: 4.423864838, color: 'blue' },
        { name: 'China', renewable: 32.11212548, color: 'red' },
        { name: 'India', renewable: 56.75214783, color: 'green' },
      ];

      xScaleLine.domain([1990, 2014]); // Will only look at these years
      xScaleBar.domain(barData.map(d => d.name)); // for the 4 countries being displayed
      yScale.domain([0, 100]); // start with yScale for barchart
      rScale.domain(d3.extent(worldData, d => d.value)); // min/max for worldData
      // yScaleLine.domain(d3.extent(countryData, d => d[metric]));

      color.domain(d3.set(worldData.map(d => d.metric)).values());
      setupVis(countryData, worldData, barData);

      setupSections(worldData);
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
  let setupVis = function (countryData, worldData, barData) {
    // x axis bar chart (first to display)
    // will redefine scale later and "recall" xAxis
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxisBar);
    g.select('.x.axis').style('opacity', 0);
    // y axis
    g.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
    g.select('.y.axis').style('opacity', 0);

    // Draw wind image
    g.append('image')
      .attr('class', 'wind-img')
      .attr('xlink:href', 'images/earth-lights.jpg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .style('opacity', 0);

    // energy title
    g.append('text')
      .attr('class', 'title welcome')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('Warming Up');

    g.append('text')
      .attr('class', 'sub-title welcome')
      .attr('x', width / 2)
      .attr('y', (height / 3) + (height / 5))
      .text('To New Energies');

    g.selectAll('.welcome')
      .style('opacity', 0);

    // Create bubble chart
    function place(metric) {
      switch (metric) {
        case 'BioFuels':
          return '200, 200';
        case 'Hydro':
          return '500, 200';
        case 'Wind':
          return '150, 460';
        case 'Other':
          return '300, 460';
        case 'Solar':
          return '450, 460';
      }
    }
    let bubbles = g.selectAll('.bubble')
      .data(worldData.filter(d => d.year === 2015))
      .enter()
      .append('g')
      .attr('class', 'bubble')
      .attr('transform', d => `translate(${place(d.metric)})`);
    bubbles.append('circle')
      .attr('r', d => rScale(d.value))
      .style('fill', d => color(d.metric))
      .style('stroke', 'grey')
      .style('opacity', 0);
    bubbles.append('text')
      .attr('dy', '.2em')
      .attr('transform', d => d.metric === 'BioFuels' | d.metric === 'Hydro' ? 'translate(0, 0)' : 'translate(0, 50)')
      .style('text-anchor', 'middle')
      .text(d => d.metric)
      .style('font-size', '2em')
      .attr('fill', 'black')
      .style('opacity', 0);

    // TODO: Draw paris image
    g.append('image')
      .attr('class', 'paris-img')
      .attr('xlink:href', 'images/paris.jpg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .style('opacity', 0);

    // TODO: Draw EQG image
    g.append('image')
      .attr('class', 'eqg-img')
      .attr('xlink:href', 'images/earth-lights.jpg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .style('opacity', 0);

    // TODO: Draw barchart
    g.selectAll('.bar')
      .data(barData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('width', xScaleBar.bandwidth())
      .attr('x', d => xScaleBar(d.name))
      .attr('height', d => height - yScale(d.renewable))
      .attr('y', d => yScale(d.renewable))
      .style('opacity', 0)
      .style('fill', d => d.color);

    // linecharts
    // GDP LINE
    yScale.domain(d3.extent(countryData, d => d.gdp));
    let line = d3.line()
      .curve(d3.curveNatural)
      .x(d => xScaleLine(d.year))
      .y(d => yScale(d.gdp));
    let path = g.append('path')
      .attr('class', 'line')
      .attr('id', 'gdp-path')
      .attr('d', line(countryData))
      .attr('stroke', 'green')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    let totalLength = path.node().getTotalLength();
    path // make path "invisible"
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength);

    //TODO: add label for recession dip?

    // RENEWABLE LINE
    yScale.domain([0, 1]); // absolute scale for percents 0-100
    line.y(d => yScale(d.renewable));
    path = g.append('path')
      .attr('class', 'line')
      .attr('id', 'renewable-path')
      .attr('d', line(countryData))
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    totalLength = path.node().getTotalLength();
    path // make path "invisible"
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength);

    // Draw vertical line for oil discovery in 1996
    // style line and add label
    g.append('line')
      .attr('x1', xScaleLine(1996))
      .attr('x2', xScaleLine(1996))
      .attr('y1', height)
      .attr('y2', height)
      .attr('class', 'trendline')
      .style('stroke', 'grey')
      .style('stroke-dasharray', '8px 4px')
      .style('stroke-width', 2)
      .style('opacity', 0);
    g.append('text')
      .attr('x', xScaleLine(1996) + 2)
      .attr('y', 20)
      .text('Oil Reserves')
      .attr('class', 'label')
      .style('opacity', 0);
    g.append('text')
      .attr('x', xScaleLine(1996) + 2)
      .attr('y', 40)
      .text('Discovered in 1996')
      .attr('class', 'label')
      .style('opacity', 0);

    g.append('image')
      .attr('class', 'image')
      .attr('xlink:href', 'images/earth-lights.jpg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .style('opacity', 0);
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
    activateFunctions[1] = showWelcome;
    activateFunctions[2] = showBubble;
    activateFunctions[3] = showParis;
    activateFunctions[4] = showEQG;
    activateFunctions[5] = showBar;
    activateFunctions[6] = showGDP;
    activateFunctions[7] = showRenewable;
    activateFunctions[8] = showEthiopia;
    activateFunctions[9] = showGDP2;
    activateFunctions[10] = showRenewable2;
    activateFunctions[11] = showClosing;
    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (let i = 0; i < 12; i++) {
      updateFunctions[i] = function () { };
    }
    updateFunctions[4] = updateEQG;
    updateFunctions[6] = updateGDP;
    updateFunctions[7] = updateRenewable;
    updateFunctions[9] = updateRenewable2;
    updateFunctions[10] = updateGDP2;
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

  // TODO: not sure if these will work - should work without the attr part
  // would call later as `element.transition(show).attr('blah', 'blah')`
  let show = d3.transition().duration(500);
  let hide = d3.transition().duration(200);

  /**
   * showTitle - initial title
   *
   * (no previous step to hide)
   * hides: welcome
   * shows: intro title
   *
   */
  function showTitle() {
    console.log('SHOW TITLE');

    g.selectAll('.welcome')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('wind-img')
      .transition(show)
      .style('opacity', 1.0);
  }

  /**
   * showWelcome -
   *
   * hides: intro title
   * hides: bubble
   * shows: welcome
   *
   */
  function showWelcome() {
    console.log('SHOW WELCOME');

    g.selectAll('.wind-img')
      .transition()
      .duration(0)
      .style('opacity', 0);

    let bubbles = g.selectAll('.bubble');
    bubbles.selectAll('circle')
      .transition(hide)
      .style('opacity', 0);
    bubbles.selectAll('text')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.welcome')
      .transition()
      .duration(600)
      .style('opacity', 1.0);
  }

  /**
   * showBubble - bubble chart for
   * energy generation by type
   *
   * hides: welcome
   * hides: paris
   * shows: bubble
   *
   */
  function showBubble() {
    console.log('SHOW BUBBLE');

    g.selectAll('.welcome')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.paris-img')
      .transition(hide)
      .style('opacity', 0);

    let bubbles = g.selectAll('.bubble');
    bubbles.selectAll('circle')
      .transition(show)
      .style('opacity', 1);
    bubbles.selectAll('text')
      .transition(show)
      .style('opacity', 1);
  }

  /**
   * showParis - paris agreement
   *
   * hides: bubble
   * hides: eqg picture
   * shows: paris img
   *
   */
  function showParis() {
    console.log('SHOW PARIS');

    let bubbles = g.selectAll('.bubble');
    bubbles.selectAll('circle')
      .transition(hide)
      .style('opacity', 0);
    bubbles.selectAll('text')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.eqg-img')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.paris-img')
      .transition(show)
      .style('opacity', 1.0);
  }

  /**
   * showEQG - Picture of Equatorial Guinea
   *
   * hides: Paris
   * hides: Bar
   * shows: EQG picture
   *
   */
  function showEQG() {
    console.log('SHOW EQG');

    g.selectAll('.paris-img')
      .transition(hide)
      .style('opacity', 0);

    hideAxes();
    g.selectAll('.bar')
      .transition(hide)
      // .attr('height', 0)
      // .attr('y', 0)
      .style('opacity', 0);

    g.selectAll('.eqg-img')
      .transition(show)
      .style('opacity', 1.0);
  }

  /**
   * showBar - bars for avg renewable %s
   *
   * hides: EQG Picture
   * hides: GDP Trendline
   * shows: line chart
   *
   */
  function showBar() {
    console.log('SHOW BAR');

    showAxes(xAxisBar, yAxis);
    g.selectAll('.y.axis')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.eqg-img')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.line')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.bar')
      .transition(show)
      .style('opacity', 1.0);
  }

  /**
   * showGDP - trend line for country GDP
   *
   * hides: bar
   * hides: renewable line
   * shows: gdp line
   *
   */
  function showGDP() {
    console.log('SHOW GDP');

    showAxes(xAxisLine, yAxis);

    g.selectAll('.bar')
      .transition(hide)
      // .attr('height', 0)
      // .attr('y', 0)
      .style('opacity', 0);

    g.selectAll('#renewable-path')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('#gdp-path')
      .style('opacity', 1);
  }

  /**
   * showRenewable - trendline for country renewables
   *
   * (will not hide previously drawn line)
   * hides: ethiopia
   * shows: renewable line
   *
   */
  function showRenewable() {
    console.log('SHOW RENEWABLE');

    showAxes(xAxisLine, yAxis);

    g.selectAll('.ethiopia')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('#renewable-path')
      .style('opacity', 1);
  }

  /**
   * showEthiopia - transition to country2
   *
   * hides: renewable and axes
   * hides: gdp2 and axes
   * shows: ethiopia img
   *
   */
  function showEthiopia() {
    console.log('SHOW ETHIOPIA');

    hideAxes();

    g.selectAll('.line')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.ethiopia')
      .transition(show)
      .style('opacity', 1);
  }

  /**
   * showGDP2 - Ethiopia GDP
   *
   * hides: Ethiopia img
   * hides: renewable2 line
   * shows: gdp2 line
   *
   */
  function showGDP2() {
    console.log('SHOW GDP2');
    showAxes(xAxisLine);

    g.selectAll('.ethiopia')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('#renewable-path2')
      .style('opacity', 0);

    g.selectAll('#gdp-path2')
      .style('opacity', 1);
  }
  /**
   * showRenewable2 - Ethiopia Renewable
   *
   * hides: GDP and axes
   * (no following step to hide)
   * shows: line chart
   *
   */
  function showRenewable2() {
    console.log('SHOW RENEWABLE');

    g.selectAll('.closing')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('#renewable-path2')
      .style('opacity', 1);
  }


  /**
   * showClosing - closing statement
   *
   * hides: GDP and axes
   * (no following step to hide)
   * shows: line chart
   *
   */
  function showClosing() {
    console.log('SHOW CLOSING');
    hideAxes();

    g.selectAll('.line')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.closing')
      .transition(show)
      .style('opacity', 1);
  }

  /**
   * showAxes - helper function to
   * display particular x and y axis
   *
   * @param xAxis - the xAxis to show
   * @param yAxis - the yAxis to show
   */
  function showAxes(xAxis, yAxis) {
    console.log('SHOW AXES' + xAxis.scale().domain() + yAxis.scale().domain());
    g.select('.x.axis')
      .call(xAxis)
      .transition(show)
      .style('opacity', 1);
    g.select('.y.axis')
      .call(yAxis)
      .transition(show)
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
      .transition(hide)
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
   * updateEQG - increase/decrease
   * percent displayed
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateEQG(progress) {
    // TODO: fix

    g.selectAll('.percent-title')
      .transition()
      .duration(0)
      .style('opacity', progress);
    g.selectAll('.percent-title.highlight')
      .style('font-size', progress * 120);
  }
  /**
   * updateGDP - progressively draw more of line
   *
   * @param progress - 0.0 - 1.0
   *  how far user has scrolled in section
   */
  function updateGDP(progress) {
    let path = g.select('#gdp-path');

    let totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dashoffset', totalLength - totalLength * progress);
  }

  /**
   * updateRenewable - progressively draw more of line
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateRenewable(progress) {
    let path = g.select('#renewable-path');

    let totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dashoffset', totalLength - totalLength * progress);
  }

  /**
   * updateGDP - progressively draw more of line
   *
   * @param progress - 0.0 - 1.0
   *  how far user has scrolled in section
   */
  function updateGDP2(progress) {
    let path = g.select('#gdp-path2');

    let totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dashoffset', totalLength - totalLength * progress);
  }

  /**
   * updateRenewable - progressively draw more of line
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateRenewable2(progress) {
    let path = g.select('#renewable-path2');

    let totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dashoffset', totalLength - totalLength * progress);
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
   * array of data objects with proper formatting.
   *
   * This function converts some attributes into
   * numbers and adds attributes used in the visualization
   *
   * @param rawData - data read in from file
   */
  function getCountryData(rawData) {
    return rawData.map(function (d) {
      d.year = +d.year;
      d.gdp = +d.gdp;
      d.renewable = +d.renewable;
      return d;
    });
  }
  /**
   * getWorldData - maps raw data to
   * array of data objects with proper formatting.
   *
   * This function converts some attributes into
   * numbers and adds attributes used in the visualization
   *
   * @param rawData - data read in from file
   */
  function getWorldData(rawData) {
    // let last = rawData[rawData.length - 1];
    // let big = parseFloat(last.BioFuels) + parseFloat(last.Hydro) + parseFloat(last.Solar) + parseFloat(last.Other) + parseFloat(last.Wind);
    var longData = [];
    rawData.forEach(row => {
      // row.dummy = big - (parseFloat(row.BioFuels) + parseFloat(row.Hydro) + parseFloat(row.Solar) + parseFloat(row.Other) + parseFloat(row.Wind));
      Object.keys(row).forEach(metric => {
        if (metric == "year") return;
        longData.push({
          year: +row.year,
          metric: metric,
          value: +row[metric]
        });
      });
    });
    return longData;
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
function display(eqqData, worldData) {

  // create a new plot and
  // display it
  let plot = scrollVis();
  d3.select('#vis')
    .datum(eqqData, worldData)
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
Promise.all([
  d3.csv('data/eqg.csv'),
  d3.csv('data/world.csv')
]).then(display);
