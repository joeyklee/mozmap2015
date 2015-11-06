window.app = {
  models: {},
  collections: {},
  views: {},
  routers: {},
  init: function() {
    app.routers.main = new app.routers.MainRouter();
    // Enable pushState for compatible browsers
    var enablePushState = true;
    // Disable for older browsers
    var pushState = !!(enablePushState && window.history && window.history.pushState);
    // Start **Backbone History**
    Backbone.history = Backbone.history || new Backbone.History({});
    Backbone.history.start({
      pushState:pushState
    });
  }
};

// Define routes
app.routers.MainRouter = Backbone.Router.extend({

  routes: {
    '*actions': 'transitAdd'
  },

  home: function(){
    app.views.main = new app.views.HomeView({});
  },

  transitAdd: function(params){
    params = helper.parseQueryString(params);
    $.getJSON("http://mozilla.github.io/mozfest-schedule-app/sessions.json")
      .done(function(results) {
        var sessions = results
          .filter(function(session) {
            return session.pathways.length > 0
              && session.scheduleblock.length > 0
              && session.start && session.start.length > 0
              && session.space && session.space.length > 0;
          })
          .map(window.helper.mungeSessionData);
        sessions = _.sortBy(sessions, 'pathway');
        sessions = _.sortBy(sessions, 'datetime');

        // write out the space-pathway matrix for clustering analysis
        // window.helper.spacePathwayMatrix(sessions);

        params = $.extend({}, config, params, { stations: sessions });
        params.title = 'MozFest 2015 Pathways Map';
        app.views.main = new app.views.TransitAddView(params);
        $('body').height(params.height).width(params.width);
     }
   );
  },

  transitEdit: function(id){
    var map = null;
    app.views.main = new app.views.TransitAddView({model: map});
  },

  transitShow: function(id){
    var map = null;
    app.views.main = new app.views.TransitShowView({model: map});
  }

});

// Init backbone app
$(document).ready(function(){
  app.init();
});
