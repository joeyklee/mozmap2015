var Data = function() {

}

// SECTION: Layout calculations

Data.setup_spaces = function() {
  var s = this;

  s.calc_breaks();
  s.group_sessions_by_time();
  s.calc_max_sessions();

}

// Calculate breakpoints between Data
Data.calc_space_breaks = function() {
  var s = this;

  var s.breaks = {},
    total = 0,
    padding = 2,
    maxes = s.max_sessions_per_space();

  for (space in maxes) {
    if (maxes[space] > 0) {
      breaks[space] = total + ((total == 0) ? 0 : padding);
      total += maxes[space] + padding;
    }
  }

  return breaks;
}

// Organise sessions by space and time
Data.group_sessions_by_time = function(sessions) {
  var s = this;

  var times = {},
    s.sessions_by_time = {};

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

  window.helper.spaceOrder.forEach(function(s) {
    if (times[s]) sessions_by_time[s] = times[s];
  });

};

// Count of maxmimum concurrent sessions per space
Data.calc_max_sessions = function() {

  var maxes = {},
    maxes_sorted = {};

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

}

// Get the start row of a space
Data.start_row = function(space) {

}

// Get the end row of a space
Data.end_row = function(space) {

}

// Organise sessions by time, returning an object with a key
// per timepoint, with the value being an Array of the Sessions
// in that timepoint across all spaces
Data.sessions_by_time = function() {
  var d = this;

  // reorganise times so they aren't grouped by space,
  // and are sorted by time
  var times_unsorted = false;
  Object.keys(d.times).forEach(function(space) {
    var spacetimes = times[space];
    if (!spacetimes) return;
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
}
