var Layout = function(config, data) {
  this.storeConfig(config);
  this.data = data;
}

// SECTION: Config

// Extract all layout related config items
// and store them in the Layout
Layout.storeConfig = function(config) {
  var l = this;

  ['width', 'height',
   'padding_x', 'padding_y',
   'spacer_x', 'spacer_y',
   'station_pad',
   'station_hub_offset',
   'min_diff_x', 'min_diff_y',
   'path_types'
 ].foreEach(function(key) {
   l[key] = config[key];
 }
}


// SECTION: Scales

// Generate the x scales - one using datetimes for laying out points,
// and one using text for the axis labels
Layout.make_scale_x = function() {
  var l = this;

  // time scale
  var times = helper.getDateTimes(stations).sort();

  l.scale_x = d3.scale.ordinal()
    .domain(times)
    .rangePoints([l.x_padding, l.width - l.x_padding]);

  // text time scale
  var time_text = times.map(function(d) {
    return moment.unix(d).format('dddd hh:mm A');
  });

  l.scale_x_text = d3.scale.ordinal()
    .domain(time_text)
    .rangePoints([l.x_padding, l.width - l.x_padding]);

  // x spacer
  // TODO: make this its own function
  l.spacer_x = (scale_x(times[1]) - xScale(times[0])) / 3;
}

// Generate the y scale
Layout.make_scale_y = function() {
  var l = this;

  l.scale_y = d3.scale.linear()
    .domain([0, l.total_rows() + 15])
    .rangeRound([l.padding_y, l.height - l.padding_y]);
}

// Generate x and y scales
Layout.make_scales = function() {
  this.make_scale_x();
  this.make_scale_y();
}

// Get the total number of rows across all spaces and channels
Layout.total_rows = function() {
  var l = this;

  return l.total_space_rows + l.total_channel_rows;
}


// SECTION: Spaces

Layout.setup_spaces = function(spaces) {
  this.data.spaces.setup();
}

Layout.layout_space = function(space) {
  var l = this;
}

// SECTION: Sessions and pathways

Layout.optimise_layout = function() {
  pathways.forEach(this.layout_pathway);
}

Layout.layout_pathway = function(pathway) {
  _.pairs(spaces.by_time).forEach(function(time, ) {

  })
}

Layout.layout_session = function(session) {

}
