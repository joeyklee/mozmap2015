app.views.TransitAddView = Backbone.View.extend({

  el: 'body',



  initialize: function(options) {
    var stations = options.stations,
        width = options.width,
        height = options.height,
        pathInterpolation = options.pathInterpolation,
        lines = [], endLines = [];

    stations = this.processStations(stations);

    // generate lines with points
    lines = this.makeLines(stations, width, height, options);
    // legend = this.makeLegend(lines, options);
    legend = {};
    endLines = this.makeEndLines(lines, options);
    lines = _.union(lines, endLines);
    lines = _.flatten(_.values(lines));

    // draw the svg map
    this.drawMap(stations, lines, legend, width, height, options);

    // add listeners
    this.addListeners();

    // truncate labels
    this.truncateLabels();

    // setup mouseover
    this.setupMouseover(options);
  },

  addDotStyles: function(dots, options){

    var pointColor = options.pointColor,
        borderColor = options.borderColor,
        borderWidth = options.borderWidth;

    _.each(dots, function(dot){
      dot.className = dot.className || '';
      // train symbol
      if (dot.symbol){
        dot.borderColor = dot.pointColor;
        dot.borderWidth = borderWidth;
      // point/station
      } else {
        dot.pointColor = pointColor;
        dot.borderColor = borderColor;
        dot.borderWidth = borderWidth;
      }
    });

    return dots;
  },

  addRectStyles: function(rects, options){
    var pointColor = options.pointColorInverse,
        borderColor = options.borderColor,
        borderWidth = options.borderWidth,
        borderRadius = options.borderRadius,
        pointRadius = options.pointRadius,
        dotSize = pointRadius*2,
        offsetHeight = options.offsetHeight - dotSize;

    _.each(rects, function(rect){
      rect.className = rect.className || '';
      // hub
      if (rect.hubSize) {
        rect.pointColor = pointColor;
        rect.borderColor = borderColor;
        rect.borderWidth = borderWidth;
        rect.borderRadius = borderRadius;
        rect.height = rect.hubSize*dotSize + offsetHeight*(rect.hubSize);
        rect.width = dotSize + 8;
        rect.rectX = rect.x - pointRadius - 4;
        rect.rectY = rect.y - pointRadius - 1;
      // legend
      } else if (rect.type=="legend") {
        rect.borderColor = borderColor;
        rect.borderWidth = borderWidth;
        rect.borderRadius = 0;
      }
      if (rect.mid) {
        rect.pointColor = 'grey';
      }
    });

    return rects;
  },

  addLabelStyles: function(labels, options){
    var fontFamily = options.fontFamily,
        textColor = options.textColor,
        fontSize = options.fontSize,
        fontWeight = options.fontWeight;

    _.each(labels, function(label){
      label.className = label.className || '';
      label.fontFamily = fontFamily;
      label.alignment = "left";
      // symbol
      if (label.symbol) {
        label.textColor = "#fff6fff";
        label.fontSize = 1;
        label.fontWeight = "bold";
        label.anchor = "middle";
        label.text = label.symbol;
        label.labelX = label.labelX!==undefined ? label.labelX : label.x + 1;
        label.labelY = label.labelY!==undefined ? label.labelY : label.y;
      // label
      } else {
        label.textColor = textColor;
        label.fontSize = label.fontSize || fontSize;
        label.fontWeight = fontWeight;
        label.anchor = label.anchor || "middle";
        label.text = label.text || label.label;
        label.labelX = label.labelX!==undefined ? label.labelX : label.x;
        label.labelY = label.labelY!==undefined ? label.labelY : label.y-10;
      }
    });

    return labels;
  },

  getXScale: function(stations, options, width, realdates) {
    var paddingX = options.padding[0];
    var times = helper.getDateTimes(stations).sort();
    if (realdates) {
      times = times.map(function(d) {
        return moment.unix(d).format('dddd hh:mm A');
      });
    }

    var xScale = d3.scale.ordinal()
      .domain(times)
      .rangePoints([paddingX, width - paddingX]);

    options.xSpacer = (xScale(times[1]) - xScale(times[0])) / 3;

    return xScale;
  },

  maxConcurrentSessions: function(sessions) {
    // group sessions by space and time
    var times = {};
    sessions.forEach(function(s) {
      var timekey = s.datetime.unix();
      if (!times[s.space]) {
        times[s.space] = {};
      }
      if (!times[s.space][timekey]) {
        times[s.space][timekey] = [];
      } else {
        times[s.space][timekey].push(s);
      }
    });
    // count maximum concurrent sessions in each space
    maxes = {};
    for (var space in times) {
      maxes[space] = 0;
      var spacetime = times[space];
      for (var datetime in spacetime) {
        var timesessions = spacetime[datetime];
        if (timesessions.length > maxes[space]) {
          maxes[space] = timesessions.length;
        }
      }
    }
    var maxes_sorted = {},
     times_sorted = {};
    window.helper.spaceOrder.forEach(function(s) {
      maxes_sorted[s] = maxes[s];
      times_sorted[s] = times[s];
    });
    return [times_sorted, maxes_sorted];
  },

  getYScale: function(options, height, maxPerSpace) {
    var that = this;

    // sum of all session maxima
    var spacerows = 0;
    Object.keys(maxPerSpace).forEach(function(space) {
      spacerows += maxPerSpace[space];
    });
    var paddingY = options.padding[1];
    var yScale = d3.scale.linear()
      .domain([0, spacerows + 15])
      .rangeRound([paddingY, height-paddingY]);
    return yScale;
  },

  getYBreaks: function(maxes) {
    breaks = {};
    total = 0;
    padding = 2;
    for (space in maxes) {
      if (maxes[space] > 0) {
        breaks[space] = total + ((total == 0) ? 0 : padding);
        total += maxes[space] + padding;
      }
    }
    return breaks;
  },

  getY: function(station, times, breaks) {
    var that = this,
      datetime = station.datetime.unix(),
      space = station.space;
    var spacestart = breaks[space];
    var spaceindex = times[space][datetime].indexOf(station) + 2;
    return spacestart + spaceindex;
  },

  drawXAxis: function(stations, svg, options, height, width) {
    var that = this,
      paddingY = options.padding[1],
      xscale = that.getXScale(stations, options, width, true);

    var xAxis = d3.svg.axis()
       .orient("bottom")
       .scale(xscale);

    // draw x axis with labels and move to the bottom of the chart area
    svg.append("g")
      .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
      .attr("transform", "translate(0," + (height - paddingY) + ")")
      .call(xAxis);

    var xAxisTop = d3.svg.axis()
      .orient("top")
      .scale(xscale);

      // draw x axis with labels and move to the bottom of the chart area
      svg.append("g")
        .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
        .attr("transform", "translate(0," + (paddingY) + ")")
        .call(xAxisTop);

    var times = helper.getDateTimes(stations).sort().forEach(function(d) {
      var time = moment.unix(d).format('dddd hh:mm A');
      var x = xscale(time);
      svg.append("line")
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', paddingY)
        .attr('y2', height-paddingY)
        .attr('stroke-dasharray', '2, 10')
        .attr('stroke', '#333333')
    });

    // now rotate text on x axis
    // solution based on idea here: https://groups.google.com/forum/?fromgroups#!topic/d3-js/heOBPQF3sAY
    // first move the text left so no longer centered on the tick
    // then rotate up to get 45 degrees.
    // svg.selectAll(".xaxis text")  // select all the text elements for the xaxis
    //   .attr("transform", function(d) {
    //     return "translate(" + height*-2 + "," + height + ")rotate(-45)";
    // });
  },

  addLineStyles: function(lines, options){
    var strokeOpacity = options.strokeOpacity,
        strokeWidth = options.strokeWidth;

    _.each(lines, function(line){
      line.className = line.className || '';
      line.strokeOpacity = strokeOpacity;
      // symbol
      if (line.type=="symbol") {
        line.color = "#aaaaaa";
        line.strokeWidth = 2;
        line.strokeDash = "2,2";

      // normal line
      } else {
        line.strokeWidth = strokeWidth;
        line.strokeDash = "none";
      }
    });

    return lines;
  },

  addListeners: function(){
    var that = this;

    // keyboard listeners
    $(document).on('keydown', function(e){
      switch(e.keyCode) {
        // o - output to json
        case 79:
          if (e.ctrlKey) that.exportSVG();
          break;
        default:
          break;
      }
    });
  },

  truncateLabels: function(){
    $(function(){
      $('.station, .legend-label').succinct({
        size: 30
      });
    });
  },

  drawDots: function(svg, dots) {
    svg.selectAll("dot")
      .data(dots).enter().append("circle")
      .attr("r", function(d) { return d.pointRadius; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("class", function(d) { return d.className || ''; })
      .style("fill", function(d){ return d.pointColor; })
      .style("stroke", function(d){ return d.borderColor; })
      .style("stroke-width", function(d){ return d.borderWidth; });
  },

  drawRects: function(svg, rects){
    _.each(rects, function(r){
      svg.append("rect")
        .attr("width", r.width)
        .attr("height", r.height)
        .attr("x", r.rectX)
        .attr("y", r.rectY)
        .attr("rx", r.borderRadius)
        .attr("ry", r.borderRadius)
        .attr("class", r.className)
        .style("fill", r.pointColor)
        .style("stroke", r.borderColor)
        .style("stroke-width", r.borderWidth);
    });
  },

  drawLabels: function(svg, labels, options) {
    svg.selectAll("text")
      .data(labels)
      .enter().append("text")
      .text( function (d) { return d.text; })
      .attr("class", function(d) { return d.className || ''; })
      .attr("x", function(d) { return d.labelX; })
      .attr("y", function(d) { return d.labelY; })
      .attr("text-anchor",function(d){ return d.anchor; })
      .attr("alignment-baseline",function(d){ return d.alignment; })
      .style("font-family", function(d){ return d.fontFamily; })
      .style("font-size", function(d){ return d.fontSize; })
      .style("font-weight", function(d){ return d.fontWeight; })
      .style("fill", function(d){ return d.textColor; });
  },

  drawLines: function(svg, lines, options) {
    var that = this,
        pathInterpolation = options.pathInterpolation,
        animate = options.animate,
        animationDuration = options.animationDuration,
        svg_line;

    svg_line = d3.svg.line()
      .interpolate(pathInterpolation)
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

    _.each(lines, function(line){
      var points = line.points,
          path = svg.append("path")
                  .attr("d", svg_line(points))
                  .attr("class", line.className)
                  .style("stroke", line.color)
                  .style("stroke-width", line.strokeWidth)
                  .style("stroke-opacity", line.strokeOpacity)
                  .style("fill", "none");

      // animate if it's a solid line
      if (path && animate && line.strokeDash=="none" && line.className.indexOf("primary")>=0) {
        var totalLength = path.node().getTotalLength();
        path
          .attr("stroke-dasharray", totalLength + " " + totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition()
            .duration(animationDuration)
            .ease("linear")
            .attr("stroke-dashoffset", 0)

      // otherwise, set the stroke dash
      } else {
        path.style("stroke-dasharray", line.strokeDash);
      }

    });
  },

  drawMap: function(stations, lines, legend, width, height, options){
    var bgColor = options.bgColor,
        svg, points, dots, labels, rects;

    // init svg and add to DOM
    $("body").height(height).width(width);

    svg = d3.select("#svg-wrapper")
      .attr("width", width)
      .attr("height", height)
      .append("svg")
      .attr("id", "map-svg")
      .attr("width", width)
      .attr("height", height);

    // extract points, dots, labels from lines
    points = _.flatten( _.pluck(lines, "points") );
    dots = _.filter(points, function(p){ return p.pointRadius && p.pointRadius > 0; });
    labels = _.filter(points, function(p){ return p.label !== undefined || p.symbol !== undefined; });
    rects = _.filter(points, function(p){ return p.hubSize; });

    // add legend items
    // lines = _.union(lines, legend.lines);
    // dots = _.union(dots, legend.dots);
    // labels = _.union(labels, legend.labels);

    // add styles
    lines = this.addLineStyles(lines, options);
    dots = this.addDotStyles(dots, options);
    labels = this.addLabelStyles(labels, options);
    rects = this.addRectStyles(rects, options);
    // legend.rects = this.addRectStyles(legend.rects, options);

    // draw lines, dots, labels, rects
    // this.drawRects(svg, legend.rects);
    this.drawXAxis(stations, svg, options, height, width);
    this.makeSpaces(svg, stations, options, height, width);
    this.drawLines(svg, lines, options);
    this.drawRects(svg, rects, options);
    this.drawDots(svg, dots, options);
    this.drawLabels(svg, labels, options);
  },

  exportSVG: function(){
    var svg_xml = $("#map-svg").parent().html(),
        b64 = window.btoa(svg_xml);

    data_url = "data:image/svg+xml;base64,\n"+b64;
    window.open(data_url, '_blank');

    // $("body").append($("<img src='data:image/svg+xml;base64,\n"+b64+"' alt='file.svg'/>"));
  },

  getColor: function(lines, colors){
    var i = lines.length;
    if (i>=colors.length) {
      i = i % lines.length;
    }
    return colors[i];
  },

  getLengths: function(xDiff, yDiff, directions) {
    var lengths = [],
        rand = _.random(20,80) / 100,
        firstX;

    yDiff = Math.abs(yDiff);

    _.each(directions, function(d, i){
      // assuming only 1 east or west
      if (d=="n" || d=="s") {
        lengths.push(yDiff);
       // assuming only 2 easts
      } else {
        if (i==0) {
          firstX = Math.round(xDiff*rand);
          lengths.push(firstX);
        } else {
          lengths.push(xDiff-firstX);
        }
      }
    });

    return lengths;

  },

  getNextX: function(boundaries, iterator, totalPoints, width, minXDiff, prevPoint){
    var x = 0,
        prevPadding = 0.25,
        trendPadding = 0.4,
        percentComplete = parseFloat(iterator/totalPoints),
        // absolute min/max based on boundaries
        absMinX = boundaries.minX,
        absMaxX = boundaries.maxX,
        // min/max based on general trend from left to right
        trendMinX = Math.round(percentComplete*width) - Math.round(width*trendPadding),
        trendMaxX = Math.round(percentComplete*width) + Math.round(width*trendPadding),
        // create arrays
        mins = [absMinX, trendMinX],
        maxs = [absMaxX, trendMaxX],
        xDiff = 0;

    // make sure point is within x% of previous point
    if (prevPoint) {
      mins.push(prevPoint.x - Math.round(width*prevPadding));
      maxs.push(prevPoint.x + Math.round(width*prevPadding));
    }

    // determine the min/max
    minX = _.max(mins);
    maxX = _.min(maxs);

    do {
      // ensure no logic error
      if (minX<maxX) {
        x =  _.random(minX, maxX);
      } else {
        x =  _.random(maxX, minX);
      }
      if (prevPoint)
        xDiff = Math.abs(Math.floor(x - prevPoint.x));
    } while(prevPoint && xDiff<minXDiff); // ensure xDiff is above min

    return x;
  },

  getSymbol: function(lineLabel, lines) {
    // prioritize characters: uppercase label, numbers, lowercase label
    var str = lineLabel.toUpperCase() + "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" + lineLabel.toLowerCase() + "abcdefghijklmnopqrstuvwxyz",
        symbols = _.pluck(lines, "symbol"),
        symbol = str.charAt(0);

    // strip spaces
    str = str.replace(" ","");

    // loop through string's characters
    for(var i=0; i<str.length; i++) {
      // get next character
      var chr = str.charAt(i);
      // if character not already taken, use as symbol
      if (symbols.indexOf(chr) < 0) {
        symbol = chr;
        break;
      }
    }

    return symbol;
  },

  getTitleLines: function(title, titleMaxLineChars) {
    var lines = [],
        titleLength = title.length,
        words = title.split(" "),
        currentLine = "";

    _.each(words, function(word){
      // if new word goes over max, start new line
      if (word.length+currentLine.length+1 > titleMaxLineChars) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += ' ' + word;
      }
    });

    if (currentLine.length) lines.push(currentLine);

    return lines;
  },

  makeEndLines: function(lines, options){
    var pointRadiusLarge = options.pointRadiusLarge,
        lineLength = pointRadiusLarge * 2 + 15,
        endLines = [],
        xHash = {};

    var pathWayDone = {};

    _.each(Object.keys(lines), function(pathway, i){
      var line = lines[pathway],
        firstPoint = _.first(line.points),
        lastPoint = _.last(line.points),
        lineClassName = helper.parameterize('line-'+line.label) + ' end-line',
        pointClassName = helper.parameterize('point-'+line.label) + ' end-line',
        lineStart = { className: lineClassName + ' start-line', type: 'symbol', points: [] },
        lineEnd = { className: lineClassName, type: 'symbol', points: [] };

        if (firstPoint==undefined) {
          return;
        }
        var fpId = 'p' + firstPoint.y,
        lpId = 'p' + lastPoint.y;

      // keep track of existing endlines points
      if (xHash[fpId]!==undefined) {
        xHash[fpId]++;
      } else {
        xHash[fpId] = 0;
      }
      if (xHash[lpId]!==undefined) {
        xHash[lpId]++;
      } else {
        xHash[lpId] = 0;
      }

      // add start line
      lineStart.points.push({
        // stagger x's that are next to each other
        x: firstPoint.x - lineLength - xHash[fpId]%2*lineLength,
        y: firstPoint.y,
        symbol: line.symbol,
        pointColor: line.color,
        pointRadius: pointRadiusLarge,
        className: pointClassName + ' symbol'
      });
      lineStart.points.push({
        x: firstPoint.x,
        y: firstPoint.y,
        className: pointClassName
      });

      if (pathWayDone[line.className]) {
        // not the canonical path for this pathway
        return;
      }

      // make end line
      lineEnd.points.push({
        x: lastPoint.x,
        y: lastPoint.y,
        className: pointClassName
      });
      lineEnd.points.push({
        // stagger x's that are next to each other
        x: lastPoint.x + lineLength + xHash[lpId]%2*lineLength,
        y: lastPoint.y,
        symbol: line.symbol,
        pointColor: line.color,
        pointRadius: pointRadiusLarge,
        className: pointClassName + ' symbol'
      });

      // add end lines
      endLines.push(lineStart, lineEnd);

      // this was the canoninical path for this pathway
      pathWayDone[line.className] = true;

    });

    return endLines;
  },

  makeSpaces: function(svg, stations, options, height, width) {
    var conc = this.maxConcurrentSessions(stations),
      times = conc[0],
      maxes = conc[1],
      ybreaks = this.getYBreaks(maxes),
      yscale = this.getYScale(options, height, maxes),
      fill = "#000000";

    for (space in breaks) {
      var y = breaks[space];
      svg.append('rect')
        .attr('x', 0)
        .attr('y', yscale(y))
        .attr('height', 5)
        .attr('width', width)
        .attr('fill', fill)
        .attr('fill-opacity', 0.4);

      svg.append('text')
        .attr('x', 20)
        .attr('y', yscale(y) + 40)
        .attr("font-family", "sans-serif")
        .attr("font-size", "30px")
        .attr("fill", "#444444")
        .text(space)

    }
  },

  makeLegend: function(lines, options){
    var // options
        canvasWidth = options.width,
        canvasPaddingX = 0,
        canvasPaddingY = 0,
        title = options.title,
        pointRadius = options.pointRadius,
        pointRadiusLarge = options.pointRadiusLarge,
        borderWidth = options.borderWidth,
        width = options.legend.width,
        columns = options.legend.columns,
        padding = options.legend.padding,
        bgColor = options.legend.bgColor,
        titleFontSize = options.legend.titleFontSize,
        titleMaxLineChars = options.legend.titleMaxLineChars,
        titleLineHeight = options.legend.titleLineHeight,
        fontSize = options.legend.fontSize,
        lineHeight = options.legend.lineHeight,
        gridUnit = options.legend.gridUnit,
        // calculations
        columnWidth = Math.floor((width-padding*2)/columns),
        titleLines = this.getTitleLines(title, titleMaxLineChars),
        x1 = canvasWidth - width - canvasPaddingX - borderWidth*2,
        y1 = canvasPaddingY,
        lineCount = lines.length,
        height = padding *2 + lineHeight*Math.ceil(lineCount/columns) + titleLineHeight*titleLines.length,
        // initializers
        legend = {dots: [], labels: [], lines: [], rects: []};

    // break up lines into columns
    var columnLines = [],
        perColumn = Math.floor(lineCount/columns),
        remainder = lineCount%columns,
        lineIndex = 0;
    _.times(columns, function(i){
      var start = lineIndex,
          end = lineIndex+perColumn;
      // add remainder to first column
      if (i===0)  end += remainder;
      columnLines.push(
        lines.slice(start, end)
      );
      lineIndex = end;
    });

    // create rectangle
    legend.rects.push({
      width: width,
      height: height,
      rectX: x1,
      rectY: y1,
      pointColor: bgColor,
      type: "legend"
    });

    // add legend padding
    x1 += padding;
    y1 += padding;

    // add title
    _.each(titleLines, function(titleLine, i){
      legend.labels.push({
        text: titleLine,
        anchor: "start",
        labelX: x1,
        labelY: y1,
        fontSize: titleFontSize,
        type: "legendTitle"
      });
      y1 += titleLineHeight;
    });

    // add a space
    y1 += gridUnit;

    // loop through columns
    _.each(columnLines, function(columnLine, c){

      var colOffset = columnWidth * c,
          y2 = y1;

      // loop through lines
      _.each(columnLine, function(line, i){

        var lineClassName = helper.parameterize('line-'+line.label) + ' legend',
            pointClassName = helper.parameterize('point-'+line.label) + ' legend';

        // add symbol dot
        legend.dots.push({
          x: colOffset+x1+pointRadiusLarge, y: y2,
          pointColor: line.color,
          symbol: line.symbol,
          pointRadius: pointRadiusLarge,
          className: pointClassName
        });
        // add symbol label
        legend.labels.push({
          text: line.symbol,
          labelX: colOffset+x1+pointRadiusLarge,
          labelY: y2+1,
          symbol: line.symbol,
          className: pointClassName
        });

        // add line
        legend.lines.push({
          color: line.color,
          type: "legend",
          className: lineClassName,
          points: [
            {x: colOffset+x1+pointRadiusLarge*2, y: y2, className: pointClassName},
            {x: colOffset+x1+pointRadiusLarge*2+gridUnit*4, y: y2, className: pointClassName}
          ]
        });
        // add line dot
        legend.dots.push({
          x: colOffset+x1+pointRadiusLarge*2+gridUnit*2, y: y2,
          pointRadius: pointRadius,
          className: pointClassName
        });
        // add line label
        legend.labels.push({
          text: line.label,
          labelX: colOffset+x1+pointRadiusLarge*2+gridUnit*5,
          labelY: y2,
          fontSize: fontSize,
          anchor: "start",
          type: "legend",
          className: pointClassName + ' legend-label'
        });

        y2+=lineHeight;
      });


    });

    return legend;

  },

  getPathData: function(stations, times, xScale, yScale, yBreaks, options) {

    var that = this,
      pathways = window.helper.getPathways(stations),
      offsetHeight = options.offsetHeight,
      cornerRadius = options.cornerRadius,
      minXDiff = options.minXDiff,
      pointRadius = options.pointRadius,
      hubSize = options.hubSize,
      xSpacer = options.xSpacer,
      xStationPad = options.xStationPad;

    // reorganise times so they aren't grouped by space,
    // and are sorted by time
    var times_unsorted = false;
    Object.keys(times).forEach(function(space) {
      var spacetimes = times[space];
      if (!times_unsorted) {
        times_unsorted = spacetimes;
      } else {
        Object.keys(spacetimes).forEach(function(time) {
          if (!times_unsorted[time]) {
            times_unsorted[time] = spacetimes[time];
          } else {
            times_unsorted[time] = times_unsorted[time].concat(spacetimes[time]);
          }
        });
      }
    });
    var times_sorted = {};
    Object.keys(times_unsorted).sort().forEach(function(time) {
      times_sorted[time] = times_unsorted[time];
    });
    var ntimes = Object.keys(times_sorted).length;

    // generate the intermediate point data for each pathway.
    // for each pathway, at each time interval...
    // find all the points for that pathway...
    // if this is the first timepoint for that pathway,
    // draw a line to the east a set distance from each point...
    // for the first and last point at that timepoint, continue the
    // line north/south to the cetner point between the highest
    // and lowest. For the last point, continue the path to the east
    // to a set point before the next time interval
    var paths = [];
    pathways.forEach(function(pathway, pi) {
      var these_paths = [[]],
        lineClass = helper.parameterize('line-'+pathway) + " primary",
        pointClass = helper.parameterize('point-'+pathway);

      var first = true,
        lastmidPoint = false;

      Object.keys(times_sorted).forEach(function(time, i) {

        // points are stations at this time in this pathway
        var points = times_sorted[time].filter(function(s) {
          return s.pathways.indexOf(pathway) > -1;
        });

        // do nothing if this pathway has no sessions in this time
        if (points.length == 0) {
          return;
        }

        var startX = xScale(points[0].datetime.unix());

        // random-ish amount by which to shuffle the x-value
        // where the paths meet
        var shunt = xSpacer;
        var shuntX = startX + shunt;

        // all paths connect to a point halfway between top and bottom
        var topY = yScale(that.getY(points[0], times, yBreaks));
        var bottomY = yScale(that.getY(_.last(points), times, yBreaks));

        var joinspacer = points.length > 1 ? (Math.floor((bottomY - topY) * 0.5)) : 0;
        var joinpointY = topY + joinspacer; // + (pi * 7);
        var nextmidPoint = that
          .getPoint(shuntX, joinpointY, pathway, pointClass, 3);

        // each point gets its own path
        points.forEach(function(p, j) {

          var path = [];

          if (i > 0 && j > 0 && lastmidPoint) {
            // reconnect from the left
            path.push(JSON.parse(lastmidPoint));
          }

          var pointY = yScale(that.getY(p, times, yBreaks));
          pointY += options.offsetHeight * (p.pathways.indexOf(pathway));

          // add the station point and one either side
          // to the left
          if (i > 0) {
            var prepoint =
              that.getPoint(startX - xStationPad, pointY, pathway,
                            pointClass, 3);
            path.push(prepoint);
          }
          // station
          var stationPoint =
            that.getPoint(startX, pointY, pathway,
                          pointClass + " station", pointRadius);
          if (p.pathways.indexOf(pathway) == 0) {
            stationPoint.hubSize = p.pathways.length;
            stationPoint.label = p.title;
          }
          path.push(stationPoint);
          // to the right
          var postpoint =
            that.getPoint(startX + xStationPad, pointY, pathway,
                          pointClass, 3);
          path.push(postpoint);

          // connect to the right
          if (i < (ntimes - 1) && points.length > 1) {
            path.push(JSON.parse(JSON.stringify(nextmidPoint)));
          }

          if (j == 0) {
            path.forEach(function(p) {
              these_paths[0].push(p);
            });
          } else {
            these_paths.push(path);
          }

        });

        // the next midpoint is halfway between the top and bottom of
        // the points in the next time
        // all paths connect to a point halfway between top and bottom
        // so, load the next points (if any)
        if (i == ntimes - 1) {
          return;
        }
        var npoints = [];
        var ni = i+1;
        while (npoints.length == 0 && ni < (ntimes - 1)) {
          var nextTime = Object.keys(times_sorted)[ni];
          npoints = times_sorted[nextTime].filter(function(s) {
            return s.pathways.indexOf(pathway) > -1;
          });
          ni += 1;
        }
        if (npoints.length < 2) {
          return;
        }

        // get the next midpoint
        var ntopY = yScale(that.getY(npoints[0], times, yBreaks));
        var nbottomY = yScale(that.getY(_.last(npoints), times, yBreaks));
        var njoinspacer = (nbottomY - ntopY) * 0.5;
        var njoinpointY = ntopY + njoinspacer;
        var nxspacer = shuntX+shunt+(3*shunt*((ni-2)-i))
        nextmidPoint = that
          .getPoint(nxspacer, njoinpointY, pathway, 'noend', false);
        // extend the canonical line
        these_paths[0].push(nextmidPoint);
        lastmidPoint = JSON.stringify(nextmidPoint);

      });

      if (these_paths.length > 0 && these_paths[0].length > 0) {
        these_paths[0][0].symbol = true;
        _.last(these_paths[0]).symbol = true;
      }

      these_paths.forEach(function(p) {
        paths.push({
          className: lineClass,
          points: p,
          strokeDash: 'none',
          color: options.colors[pathways.indexOf(pathway)].hex
        });
      });

    }); // forEach pathways

    return paths;
  },

  getPoint: function(x, y, line, pointClass, radius) {
    return {
      x: x,
      y: y,
      lineLabel: line,
      className: pointClass,
      pointRadius: radius
    };
  },

  makeLines: function(stations, width, height, options){
    var that = this,
        // options
        paddingX = options.padding[0],
        paddingY = options.padding[1],
        colors = options.colors,
        pathTypes = options.pathTypes,
        offsetHeight = options.offsetHeight,
        cornerRadius = options.cornerRadius,
        minXDiff = options.minXDiff,
        pointRadius = options.pointRadius,
        hubSize = options.hubSize,
        // calculations
        activeW = width - paddingX*2,
        activeH = height - paddingY*2,
        boundaries = {minX: paddingX, minY: paddingY, maxX: width-paddingX, maxY: height-paddingY},
        stationCount = stations.length,
        // initializers
        lines = [],
        prevLines = [],
        xScale = that.getXScale(stations, options, width);

    // setup for y scale
    var concurrent = that.maxConcurrentSessions(stations);
    var times = concurrent[0],
      maxes = concurrent[1],
      yScale = that.getYScale(options, activeH, maxes),
      yBreaks = that.getYBreaks(maxes);

    return that.getPathData(stations, times, xScale,
                            yScale, yBreaks, options);
  },

  processStations: function(stations){
    var that = this,
        lineLabels = _.uniq( _.flatten( _.pluck(stations, 'lines') ) ); // get unique lines

    // loop through each point
    _.each(stations, function(station, i){
      // sort all the lines consistently
      station.pathways = _.sortBy(station.pathways, function(lineLabel){ return lineLabels.indexOf(lineLabel); });
    });

    return stations;
  },

  setupMouseover: function(options) {

    var that = this;

    var normal = options.strokeWidth,
      thick = options.strokeSelectedWidth;

    d3.select("#svg-wrapper").selectAll('path')
      .on('mouseover', function(d) {
        var className = $(this).attr('class').split(' ')[0];
        d3.selectAll("." + className)
        .transition()
        .duration(50)
        .style('stroke-width', thick);

        that.showPathwayInfo(this, className);
      })
      .on('mouseout', function(d) {
        var className = $(this).attr('class').split(' ')[0];
        d3.selectAll("." + className)
          .transition()
          .duration(50)
          .style('stroke-width', normal);

        that.hidePathWayInfo(this, className);
      });
  },

  showPathwayInfo: function(that, className) {
    var coordinates = d3.mouse(that);
    var x = coordinates[0] - 90;
    var y = coordinates[1] - 60;
    console.log(coordinates);
    className = className
      .split('-')
      .slice(1)
      .join(' ')
      .replace(/(^| )(\w)/g, function(x) {
        return x.toUpperCase();
      });
    d3.select('body')
      .append('div')
      .attr('id', 'pathway-data')
      .attr('style', 'position:absolute; left:' + x + 'px; top:' + y + 'px; width:auto; height:200px; z-index: 999;')
      .append('h2').text(className);
  },

  hidePathWayInfo: function(that, className) {
    d3.select('#pathway-data').remove();
  }

});
