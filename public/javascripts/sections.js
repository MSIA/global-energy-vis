let scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  let width = 600;
  let height = 520;
  let margin = { top: 10, left: 50, bottom: 40, right: 50 };

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
  let color = d3.scaleOrdinal(d3.schemeSet3);

  // Setup x for line chart
  let xScaleLine = d3.scaleLinear()
    .range([0, width]);
  let xAxisLine = d3.axisBottom()
    .scale(xScaleLine)
    .tickFormat(d3.format('d'));

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
      window.countryData = countryData
      const barData = [
        { name: 'EQG', renewable: 83.88478497, color: '#FF9933' },
        { name: 'USA', renewable: 4.423864838, color: '#6699CC' },
        { name: 'China', renewable: 32.11212548, color: '#CC3333' },
        { name: 'India', renewable: 56.75214783, color: '#607D3D' },
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
      .attr('xlink:href', 'images/wind.jpg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height);

    // energy title
    g.append('text')
      .attr('class', 'sub-title welcome')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('Global Energy Consumption')
      .style('font-size', '50px');
    g.append('text')
      .attr('class', 'sub-title welcome')
      .attr('x', width / 2)
      .attr('y', 1.3 * height / 3)
      .text('from Renewable Sources')
      .style('font-size', '50px');

    g.append('text')
      .attr('class', 'title welcome')
      .attr('x', width / 2)
      .attr('y', (1.5 * height / 3) + (height / 5))
      .style('fill', 'crimson')
      .text('0%');

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
      .attr('r', 0) // hide bubbles at start
      .style('fill', d => color(d.metric))
      .style('stroke', 'grey')
      .style('opacity', 0); //TODO: may not need this
    bubbles.append('text')
      .attr('dy', '.2em')
      .attr('transform', d => d.metric === 'BioFuels' | d.metric === 'Hydro' ? 'translate(0, 0)' : 'translate(0, 50)')
      .style('text-anchor', 'middle')
      .text(d => d.metric)
      .style('font-size', '2em')
      .attr('fill', 'black')
      .style('opacity', 0);

    // Draw paris image
    g.append('image')
      .attr('class', 'paris-img')
      .attr('xlink:href', 'images/paris.jpg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .style('opacity', 0);

    // Draw EQG image
    g.append('image')
      .attr('class', 'eqg-img')
      .attr('xlink:href', 'images/eqg.png')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .style('opacity', 0);

    // Draw barchart
    let bars = g.selectAll('.bar')
      .data(barData)
      .enter().append('g')
      .attr('class', 'bar');
    bars.append('rect')
      .attr('class', 'bar')
      .attr('width', xScaleBar.bandwidth())
      .attr('x', d => xScaleBar(d.name))
      .attr('height', 0)
      .attr('y', height)
      .style('opacity', 0)
      .style('fill', d => d.color);
    bars.append('text')
      .attr('class', 'bar-label')
      .attr('transform', d => `translate(${xScaleBar(d.name)}, ${yScale(d.renewable)})`)
      .attr('dx', xScaleBar.bandwidth() / 2)
      .attr('dy', -5)
      .style('text-anchor', 'middle')
      .text(d => d3.format('.1%')(d.renewable / 100))
      .style('opacity', 0);
    bars.append('text')
      .attr('class', 'bar-label')
      .attr('transform', d => `translate(${xScaleBar(d.name)}, ${yScale(d.renewable)})`)
      .attr('dx', xScaleBar.bandwidth() / 2)
      .attr('dy', -25)
      .style('text-anchor', 'middle')
      .text(d => d.name)
      .style('font-weight', 'bold')
      .style('opacity', 0);

    // EQG linecharts
    // GDP LINE
    let data = countryData.filter(d => d.country === 'EQG');
    yScale.domain(d3.extent(data, d => d.gdp));
    let line = d3.line()
      .curve(d3.curveNatural)
      .x(d => xScaleLine(d.year))
      .y(d => yScale(d.gdp));
    let path = g.append('path')
      .attr('class', 'line')
      .attr('id', 'gdp-path')
      .attr('d', line(data))
      .attr('stroke', 'steelblue')
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
      .attr('d', line(data))
      .attr('stroke', 'green')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    totalLength = path.node().getTotalLength();
    path // make path "invisible"
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength);

    // Legend for line charts
    let legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(25, 110)`)
      .style('opacity', 0);
    legend.append('rect')
      .attr('class', 'gdp')
      .attr('width', 15)
      .attr('height', 15)
      .style('fill', 'steelblue');
    legend.append('text')
      .attr('class', 'gdp')
      .attr('transform', 'translate(20, 12)')
      .style('fill', 'steelblue')
      .style('font-size', '12px')
      .text('GDP (mil USD)');
    legend.append('rect')
      .attr('class', 'renewable')
      .attr('width', 15)
      .attr('height', 15)
      .attr('transform', 'translate(0, 25)')
      .style('fill', 'green');
    legend.append('text')
      .attr('class', 'renewable')
      .attr('transform', 'translate(20, 37)')
      .style('fill', 'green')
      .style('font-size', '12px')
      .text('% Renewable');


    // Draw vertical line for oil discovery in 1996
    // style line and add label
    g.append('line')
      .attr('x1', xScaleLine(1996))
      .attr('x2', xScaleLine(1996))
      .attr('y1', height)
      .attr('y2', height) // hides line at start
      .attr('class', 'label line')
      .style('stroke', 'grey')
      .style('stroke-dasharray', '8px 4px')
      .style('stroke-width', 2);
    g.append('text')
      .attr('x', xScaleLine(1996) + 2)
      .attr('y', 20)
      .text('Oil Reserves')
      .attr('class', 'label text')
      .style('opacity', 0);
    g.append('text')
      .attr('x', xScaleLine(1996) + 2)
      .attr('y', 40)
      .text('Discovered in 1996')
      .attr('class', 'label text')
      .style('opacity', 0);

    // imgae for Ethiopia
    g.append('image')
      .attr('class', 'ethiopia')
      .attr('xlink:href', 'images/ethiopia.png')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .style('opacity', 0);

    // Ethiopia linecharts
    // GDP LINE
    data = countryData.filter(d => d.country === 'Ethiopia');
    yScale.domain(d3.extent(data, d => d.gdp));
    line = d3.line()
      .curve(d3.curveNatural)
      .x(d => xScaleLine(d.year))
      .y(d => yScale(d.gdp));
    path = g.append('path')
      .attr('class', 'line')
      .attr('id', 'gdp-path2')
      .attr('d', line(data))
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    totalLength = path.node().getTotalLength();
    path // make path "invisible"
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength);

    // RENEWABLE LINE
    yScale.domain([0, 1]); // absolute scale for percents 0-100
    line.y(d => yScale(d.renewable));
    path = g.append('path')
      .attr('class', 'line')
      .attr('id', 'renewable-path2')
      .attr('d', line(data))
      .attr('stroke', 'green')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    totalLength = path.node().getTotalLength();
    path // make path "invisible"
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength);

    // closing
    g.append('text')
      .attr('class', 'title closing')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('Now it\'s');

    g.append('text')
      .attr('class', 'title closing')
      .attr('x', width / 2)
      .attr('y', 1.5 * height / 3)
      .text('your turn');

    g.append('text')
      .attr('class', 'sub-title closing')
      .attr('x', width / 2)
      .attr('y', (1.5 * height / 3) + (height / 4) + 15)
      .style('fill', 'crimson')
      .text('What will you uncover?');

    g.selectAll('.closing')
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
    updateFunctions[1] = updateWelcome;
    updateFunctions[4] = updateEQG;
    updateFunctions[6] = updateGDP;
    updateFunctions[7] = updateRenewable;
    updateFunctions[8] = updateEthiopia;
    updateFunctions[9] = updateGDP2;
    updateFunctions[10] = updateRenewable2;
    updateFunctions[11] = updateClosing;
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

  // call later as `element.transition(show).attr('blah', 'blah')`
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

    g.selectAll('.wind-img')
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
      .transition(hide)
      .style('opacity', 0);

    let bubbles = g.selectAll('.bubble');
    bubbles.selectAll('circle')
      .transition(hide)
      .attr('r', 0)
      .style('opacity', 0);
    bubbles.selectAll('text')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.welcome')
      .transition(show)
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

    let bubbles = g.selectAll('.bubble').style('opacity', 1);
    bubbles.selectAll('circle')
      .style('opacity', 1)
      .transition(show)
      .ease(d3.easeCubic)
      .attr('r', d => rScale(d.value));
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
      .attr('r', 0)
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
      .attr('height', 0)
      .attr('y', height)
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
    g.select('.label.line')
      .transition(hide)
      .style('opacity', 0)
      .attr('y1', height);
    g.selectAll('.label.text')
      .transition(hide)
      .style('opacity', 0);
    g.selectAll('.legend')
      .transition(hide)
      .style('opacity', 0);

    yScale.domain([0, 100]);
    g.selectAll('.bar')
      .style('opacity', 1.0)
      .transition(show)
      .ease(d3.easeCubic)
      .attr('height', d => height - yScale(d.renewable))
      .attr('y', d => yScale(d.renewable));
    g.selectAll('.bar-label')
      .transition(show)
      .style('opacity', 1);

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
    yScale.domain([0, 21736.50071]);
    showAxes(xAxisLine, yAxis.tickFormat(d3.format('0,d')));

    g.selectAll('.bar')
      .transition(hide)
      .attr('height', 0)
      .attr('y', height)
      .style('opacity', 0);

    g.selectAll('#renewable-path')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('#gdp-path')
      .style('opacity', 1);
    g.select('.label.line')
      .style('opacity', 1)
      .transition(show)
      .attr('y1', 0);
    g.selectAll('.label.text')
      .transition(show)
      .style('opacity', 1);
    g.selectAll('.legend')
      .transition(show)
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
    yScale.domain([0, 1]);
    showAxes(xAxisLine, yAxis.tickFormat(d3.format('.0%')));

    g.selectAll('.ethiopia')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('#renewable-path')
      .style('opacity', 1);
    g.select('.label.line')
      .style('opacity', 1)
      .transition(show)
      .attr('y1', 0);
    g.selectAll('.label.text')
      .transition(show)
      .style('opacity', 1);
    g.selectAll('.legend')
      .transition(show)
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
    g.select('.label.line')
      .transition(hide)
      .style('opacity', 0)
      .attr('y1', height);
    g.selectAll('.label.text')
      .transition(hide)
      .style('opacity', 0);
    g.selectAll('.legend')
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
    yScale.domain([0, 44085.55618]);
    showAxes(xAxisLine, yAxis.tickFormat(d3.format('0,d')));

    g.selectAll('.ethiopia')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('#renewable-path2')
      .style('opacity', 0);

    g.selectAll('.legend')
      .transition(show)
      .style('opacity', 1);
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
    console.log('SHOW RENEWABLE2');
    yScale.domain([0, 1]);
    showAxes(xAxisLine, yAxis.tickFormat(d3.format('.0%')));

    g.selectAll('.closing')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.legend')
      .transition(show)
      .style('opacity', 1);
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
    g.selectAll('.legend')
      .transition(hide)
      .style('opacity', 0);

    g.selectAll('.closing.title')
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
      .transition(show)
      .ease(d3.easeCubic)
      .call(xAxis)
      .style('opacity', 1);
    g.select('.y.axis')
      .transition(show)
      .ease(d3.easeCubic)
      .call(yAxis)
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

  //TODO: do something with dynamic text?
  /**
   * updateWelcome -
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateWelcome(progress) {
    g.selectAll('.welcome.title')
      .text(d3.format('.1%')(0.125 * progress, 3))
      .style('font-size', 100 + progress * 60);
  }

  /**
   * updateEQG -
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateEQG(progress) {
    g.selectAll('.eqg-img')
      .attr('x', -300 * progress)
      .attr('y', -300 * progress)
      .attr('height', height + 500 * progress)
      .attr('width', width + 500 * progress);
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
   * updateEthiopia -
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateEthiopia(progress) {
    g.selectAll('.ethiopia')
      .attr('x', -250 * progress)
      .attr('y', -250 * progress)
      .attr('height', height + 500 * progress)
      .attr('width', width + 500 * progress);
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
   * updateEQG - increase/decrease
   * percent displayed
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateClosing(progress) {
    progress = Math.min(progress, 1);
    console.log(progress)
    g.selectAll('.closing.sub-title')
      .attr('dy', progress * -65)
      .style('opacity', 0.3 + progress * 0.7);
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
        if (metric === 'year') return;
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
