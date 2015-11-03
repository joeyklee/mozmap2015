// Helper functions
(function() {
  window.helper = {};
  helper.halton = function(index, base) {
    var result = 0;
    var f = 1 / base;
    var i = index;
    while(i > 0) {
      result = result + f * (i % base);
      i = Math.floor(i / base);
      f = f / base;
    }
    return result;
  };

  helper.parameterize = function(str){
    return str.trim().replace(/[^a-zA-Z0-9-\s]/g, '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  };

  helper.parseQueryString = function(queryString){
    var params = {};
    if(queryString){
      _.each(
        _.map(decodeURI(queryString).split(/&/g),function(el,i){
          var aux = el.split('='), o = {};
          if(aux.length >= 1){
            var val = undefined;
            if(aux.length == 2)
              val = aux[1];
            o[aux[0]] = val;
          }
          return o;
        }),
        function(o){
          _.extend(params,o);
        }
      );
    }
    return params;
  };
  helper.randomString = function(length){
    var text = "",
        alpha = "abcdefghijklmnopqrstuvwxyz",
        alphanum = "abcdefghijklmnopqrstuvwxyz0123456789 ",
    length = length || 8;
    for( var i=0; i < length; i++ ) {
      if ( i <= 0 ) { // must start with letter
        text += alpha.charAt(Math.floor(Math.random() * alpha.length));
      } else {
        text += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
      }
    }
    return text;
  };
  helper.round = function(num, dec) {
    num = parseFloat( num );
    dec = dec || 0;
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
  };
  helper.roundToNearest = function(num, nearest){
    return nearest * Math.round(num/nearest);
  };
  helper.floorToNearest = function(num, nearest){
    return nearest * Math.floor(num/nearest);
  };

  // Clean up session data and perform any manipulations needed
  helper.mungeSessionData = function(session) {

    // clean up pathways
    var pathways = session.pathways
      .split(/(\,| \[youthZone\] )/g) // split joined pathways
      .map(function(x) {
        return x
          .replace('[MLN]','') // remove in-pathway labels
          .replace('[Pathway]','')
          .replace('[youthZone]','')
          .replace('Pathway - ','')
          .replace('Pathway Craft - ','')
          .trim(); // handle leading/trailing spaces
      })
      .filter(function(x) {
        return x.length > 0; // remove empty strings
      });
    session.pathways = pathways;

    // set datetime from scheduleblock and start
    var dayDates = {
      'friday': "2015-11-6",
      'saturday': "2015-11-7",
      'sunday': "2015-11-8"
    }
    var day = session.scheduleblock.split('-')[0];
    if (day === 'all') {
      day = session.scheduleblock.split('-')[1];
    }
    var date = dayDates[day];
    if (session.start === "All Day" || session.start === "All Weekend") {
      session.start = '09:00 AM';
    }
    session.datetime = moment(date + ' ' + session.start);

    return session;
  };
})();
