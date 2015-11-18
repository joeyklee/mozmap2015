function applyLens(svg, height, width) {
  var xFisheye = d3.fisheye
    .scale(d3.scale.identity)
    .domain([0, width])
    .focus(360),
  yFisheye = d3.fisheye
    .scale(d3.scale.identity)
    .domain([0, height])
    .focus(90);

  svg.on("mousemove", function() {
    var mouse = d3.mouse(this);
    xFisheye.focus(mouse[0]);
    yFisheye.focus(mouse[1]);
    redraw();
  });

  var line = d3.svg.line();
  var path = svg.selectAll("path")
    .attr("d", line);

  function path(d) {
    return line(dimensions.map(function(p) { return [fisheye(x(p)), y[p](d[p])]; }));
  }

  function redraw() {
    path.attr("d", function(d) { return line(d.map(fisheye)); });
  }

};
