var Cartographer = function() {

}

Cartographer.draw_spaces = function() {
  svg
    .data(spaces)
    .append('rect')
    .attr('x', 0)
    .attr('y', l.scale_y(y))
    .attr('height', 5)
    .attr('width', l.width);
}

Cartographer.draw_pathways = function() {
  svg_line = d3.svg.line()
    .interpolate(pathInterpolation)
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

  _.each(lines, function(line){

    var points = line.points;

    var bgpath = svg.append("path")
      .attr("d", svg_line(points))
      .attr("class", 'bgline-' + line.className)
      .style("stroke", "black")
      .style("stroke-width", line.strokeWidth + 2)
      .style("stroke-opacity", line.strokeOpacity)
      .style("fill", "none")
      .style("stroke-dasharray", line.strokeDash);

    var path = svg.append("path")
      .attr("d", svg_line(points))
      .attr("class", line.className)
      .style("stroke", line.color)
      .style("stroke-width", line.strokeWidth)
      .style("stroke-opacity", line.strokeOpacity)
      .style("fill", "none")
      .style("stroke-dasharray", line.strokeDash);

  });
}

Cartographer.draw_sessions = function() {
  // hubs
  svg.selectAll("rect")
    .data(rects).enter()
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

  // dots
  svg.selectAll("dot")
    .data(dots).enter().append("circle")
    .attr("r", function(d) { return d.pointRadius; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("class", function(d) { return d.className || ''; })
    .style("fill", function(d) { return d.pointColor; })
    .style("stroke", function(d) { return d.borderColor; })
    .style("stroke-width", function(d) { return d.borderWidth; })
    .attr('id', function(d, i) { return "dot_" + i; });

  // labels
  svg.selectAll("text")
    .data(labels).enter().append("text")
    .text(function(d) { return d.text; })
    .attr("class", function(d) { return d.className || ''; })
    .attr("x", function(d) { return d.labelX; })
    .attr("y", function(d) { return d.labelY; })
    .attr("text-anchor", function(d) { return d.anchor; })
    .attr("alignment-baseline", function(d) { return d.alignment; })
    .style("font-family", function(d) { return d.fontFamily; })
    .style("font-size", function(d) { return d.fontSize; })
    .style("font-weight", function(d) { return d.fontWeight; })
    .style("fill", function(d) { return d.textColor; });
}

Cartographer.draw_x_axis = function() {
  var that = this,
  paddingY = options.padding[1],
  xscale = that.getXScale(stations, options, width, true);

  var xAxis = d3.svg.axis()
  .orient("bottom")
  .scale(xscale);

  // draw x axis with labels and move to the bottom of the chart area
  svg.append("g")
  .attr("class", "xaxis") // give it a class so it can be used to select only xaxis labels  below
  .attr("transform", "translate(0," + (height - paddingY) + ")")
  .call(xAxis);

  var xAxisTop = d3.svg.axis()
  .orient("top")
  .scale(xscale);

  // draw x axis with labels and move to the bottom of the chart area
  svg.append("g")
  .attr("class", "xaxis") // give it a class so it can be used to select only xaxis labels  below
  .attr("transform", "translate(0," + (paddingY) + ")")
  .call(xAxisTop);

  var times = helper.getDateTimes(stations).sort().forEach(function(d) {
    var time = moment.unix(d).format('dddd hh:mm A');
    var x = xscale(time);
    svg.append("line")
    .attr('x1', x)
    .attr('x2', x)
    .attr('y1', paddingY)
    .attr('y2', height - paddingY)
    .attr('stroke-dasharray', '2, 10')
    .attr('stroke', '#333333')
  });
}
