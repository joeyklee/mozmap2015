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
    // endLines = this.makeEndLines(lines, options);
    // lines = _.union(lines, endLines);
    // lines = _.flatten(_.values(lines));

    // draw the svg map
    this.drawMap(stations, lines, legend, width, height, options);

    if (options.animate) {
      this.animateMap();
    }

    // activate pan-zoom
    // this.panZoom($("map-svg"));

    // add listeners
    this.addListeners();

    // tuncate labels
    this.truncateLabels();
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
    var pointColor = options.pointColor,
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
        rect.height = rect.hubSize*dotSize + offsetHeight*(rect.hubSize-1);
        rect.width = dotSize;
        rect.rectX = rect.x - pointRadius;
        rect.rectY = rect.y - pointRadius;
      // legend
      } else if (rect.type=="legend") {
        rect.borderColor = borderColor;
        rect.borderWidth = borderWidth;
        rect.borderRadius = 0;
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
      label.alignment = "middle";
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
        label.anchor = label.anchor || "end";
        label.text = label.text || label.label;
        label.labelX = label.labelX!==undefined ? label.labelX : label.x;
        label.labelY = label.labelY!==undefined ? label.labelY : label.y-10;
      }
    });

    return labels;
  },

  getXScale: function(stations, options, width) {
    var paddingX = options.padding[0];
    var times = helper.getDateTimes(stations);

    var xScale = d3.scale.ordinal()
      .domain(times)
      .rangePoints([paddingX, width - paddingX]);

    return xScale;
  },

  maxConcurrentSessions: function(sessions) {
    // group sessions by space and time
    var times = {};
    sessions.forEach(function(s) {
      var timekey = s.datetime.format('dddd hh:mm A');
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
      .domain([0, spacerows])
      .range([paddingY, height-paddingY])
      .clamp(true);
    return yScale;
  },

  getYBreaks: function(maxes) {
    breaks = {};
    total = 0;
    i = 1;
    padding = 2;
    for (space in maxes) {
      breaks[space] = total + padding;
      total += maxes[space] + padding;
    }
    i++;
    return breaks;
  },

  getY: function(station, times, breaks) {
    var that = this,
      datetime = station.datetime.format('dddd hh:mm A'),
      space = station.space;
    var spacestart = breaks[space];
    var spaceindex = times[space][datetime].indexOf(station) + 2;
    return spacestart + spaceindex;
  },

  drawXAxis: function(stations, svg, options, height, width) {
    var that = this,
      paddingY = options.padding[1];

    var xAxis = d3.svg.axis()
       .orient("bottom")
       .scale(that.getXScale(stations, options, width));

    // draw x axis with labels and move to the bottom of the chart area
    svg.append("g")
      .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
      .attr("transform", "translate(0," + (height - paddingY) + ")")
      .call(xAxis);

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

  animateMap: function(){

  },

  drawDots: function(svg, dots) {
    svg.selectAll("dot")
      .data(dots)
      .enter().append("circle")
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
    svg = d3.select("#svg-wrapper")
      .append("svg")
      .attr("id", "map-svg")
      .attr("width", width)
      .attr("height", height);

    // extract points, dots, labels from lines
    // points = _.flatten( _.pluck(lines, "points") );
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
    this.makeSpaces(svg, stations, options, height, width);
    this.drawLines(svg, lines, options);
    this.drawDots(svg, dots, options);
    this.drawRects(svg, rects, options);
    this.drawLabels(svg, labels, options);
    this.drawXAxis(stations, svg, options, height, width);
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

  getPointsBetween: function(p1, p2, pathTypes, cornerRadius) {
    var that = this,
        points = [],
        x1 = p1.x, y1 = p1.y,
        x2 = p2.x, y2 = p2.y,
        yDiff = y2 - y1
        xDiff = x2 - x1,
        yDirection = false,
        pathType = false;

    // determine y direction
    if (yDiff > 0) {
      yDirection = "n";
    } else if (yDiff < 0) {
      yDirection = "s";
    }

    // filter and choose random path type
    pathTypes = _.filter(pathTypes, function(pt){
      return pt.yDirection===yDirection;
    });
    pathType = _.sample(pathTypes);

    // get points if path type exists
    if (pathType && yDirection) {

      // retrieve directions
      var directions = pathType.directions;

      // retrieve lengths
      var x = x1, y = y1,
          lengths = that.getLengths(xDiff, yDiff, directions);

      // generate points
      _.each(directions, function(direction, i){
        var length = lengths[i],
            point = that.translateCoordinates(x, y, direction, length),
            pointR1 = false, pointR2 = false;

        x = point.x;
        y = point.y;
        point.id = _.uniqueId('p');
        point.direction1 = direction;

        // add transition points if corner radius
        if (cornerRadius>0 && cornerRadius<length/2) {
          if (direction=="e") {
            pointR1 = { x: x+length+cornerRadius, y: y };
            pointR2 = { x: x+cornerRadius, y: y };
          } else if (direction=="s") {
            pointR1 = { x: x, y: y-length+cornerRadius };
            pointR2 = { x: x, y: y-cornerRadius };
          } else {
            pointR1 = { x: x, y: y+length-cornerRadius };
            pointR2 = { x: x, y: y+cornerRadius };
          }
        }

        // add points
        if (pointR1) points.push(pointR1);
        if (pointR2) points.push(pointR2);
        points.push(point);

        // add direction out
        if (i>0) {
          points[i-1].direction2 = direction;
        }
      });

      // ensure the last point matches target
      if (points.length > 0) {
        points[points.length-1].x = x2;
        points[points.length-1].y = y2;
      }

    // otherwise, just return target point
    } else {
      points.push({
        id: _.uniqueId('p'),
        direction1: 'e',
        x: x2,
        y: y2
      });
    }

    return points;
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

    _.each(Object.keys(lines), function(pathway, i){
      var line = lines[pathway][0],
        firstPoint = line.points[0],
        lastPoint = line.points[line.points.length-1],
        lineClassName = helper.parameterize('line-'+line.label) + ' end-line',
        pointClassName = helper.parameterize('point-'+line.label) + ' end-line',
        lineStart = { className: lineClassName + ' start-line', type: 'symbol', points: [] },
        lineEnd = { className: lineClassName, type: 'symbol', points: [] },
        fpId = 'p'+firstPoint.y,
        lpId = 'p'+lastPoint.y;

      // keep track of existing x points
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
    }
  },

  makeLegend: function(lines, options){
    var // options
        canvasWidth = options.width,
        canvasPaddingX = options.padding[0],
        canvasPaddingY = options.padding[1],
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
      hubSize = options.hubSize;

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
    pathways.forEach(function(pathway) {
      var these_paths = [[]],
        lineClassName = helper.parameterize('line-'+pathway) + " primary",
        pointClassName = helper.parameterize('point-'+pathway);

      Object.keys(times_sorted).forEach(function(time) {

        // points are stations at this time in this pathway
        var points = times_sorted[time].filter(function(s) {
          return s.pathways.indexOf(pathway) > -1;
        });
        if (points.length == 0) {
          return;
        }

        var startX = xScale(points[0].datetime.format('dddd hh:mm A'));

        // random-ish amount by which to shuffle the x-value
        // where the paths meet
        var shunt = Math.floor(Math.random() * 10) + 20
        var shuntX = startX + shunt;

        var topY = yScale(that.getY(points[0], times, yBreaks));

        // lone points go in the first path
        these_paths[0].push({
          x: startX,
          y: topY,
          lineLabel: pathway,
          pointRadius: pointRadius,
          className: pointClassName + " station"
        });

        // and get a line to the east
        these_paths[0].push({
          x: shuntX,
          y: topY,
          lineLabel: pathway,
          className: pointClassName
        });

        // each other point gets its own path
        points.splice(1).forEach(function(p) {
          // add the station point
          var path = [{
            x: startX,
            y: yScale(that.getY(p, times, yBreaks)),
            lineLabel: pathway,
            pointRadius: pointRadius,
            className: pointClassName + " station"
          },
          { // and the line to the east
            x: shuntX,
            y: yScale(that.getY(p, times, yBreaks)),
            lineLabel: pathway,
            className: pointClassName
          }];

          these_paths.push(path);
        });

        // the first and last paths connect back to somewhere between the
        // top and bottom points (in the middle 60%)
        var bottomY = yScale(that.getY(_.last(points), times, yBreaks));
        var joinregion = Math.floor((bottomY - topY) * 0.6);
        var joinspacer = Math.floor(Math.random() * joinregion) + 1;
        var joinpoint = topY + joinspacer;

        // make the line bottom -> join
        _.last(these_paths).push({
          x: shuntX,
          y: joinpoint,
          lineLabel: pathway,
          className: pointClassName
        });

        // make the line top -> join
        these_paths[0].push({
          x: shuntX,
          y: topY,
          lineLabel: pathway,
          className: pointClassName
        });

      });

      these_paths.forEach(function(p) {
        paths.push({
          className: lineClassName,
          points: p,
          strokeDash: 'none',
          color: genColors()[pathways.indexOf(pathway)]
        });
      })
    });

    return paths;
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
      yScale = that.getYScale(options, height, maxes),
      yBreaks = that.getYBreaks(maxes);

    return that.getPathData(stations, times, xScale,
                            yScale, yBreaks, options);
  },

  panZoom: function($selector){
    var $panzoom = $selector.panzoom({
      $zoomIn: $('.svg-zoom-in'),
      $zoomOut: $('.svg-zoom-out')
    });
    $panzoom.parent().on('mousewheel.focal', function( e ) {
      e.preventDefault();
      var delta = e.delta || e.originalEvent.wheelDelta;
      var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
      $panzoom.panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
      });
    });
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

  translateCoordinates: function(x, y, direction, length){
    var x_direction = 0, y_direction = 0;

    switch(direction){
      case 'n':
        y_direction = 1;
        break;
      case 'e':
        x_direction = 1;
        break;
      case 's':
        y_direction = -1;
        break;
    }
    return {
      x: x,
      y: y + length * y_direction
    };
  }

});
