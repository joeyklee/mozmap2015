if (Meteor.isServer) {
    Meteor.startup(function() {


        // code to run on server at startup
        var Twit = Meteor.npmRequire('twit');
        var Fiber = Meteor.npmRequire('fibers');
        var conf = JSON.parse(Assets.getText('twitterkeys.json'));

        var T = new Twit({
            consumer_key: conf.consumer_key,
            consumer_secret: conf.consumer_secret,
            access_token: conf.access_token,
            access_token_secret: conf.access_token_secret
        });

        var sesh = Array.apply(0, Array(200)).map(function (x, y) { return "mozmap" + y; });
        var stream = T.stream('statuses/filter', {
            //['#mozfest, #session9999'] // 'openscience', 'notopenscience', 'icanhazpdf', 'opendata', 'openresearch'
            track: sesh  
        })


        // add in the sessions for counting
        if (Checkins.find().count() === 0){
            sesh.forEach(function(d, i){
                var test = {};
                test['key'] = d;
                test['checkins'] = 0;
                Checkins.insert(test);
            });
        }
        // stream the tweets
        stream.on('tweet', Meteor.bindEnvironment(function(tweet) {
            console.log(tweet);
            Tweet.insert(tweet);


            tweet.entities.hashtags.forEach(function(d){
                if (d.text.substring(0,6) == "mozmap"){
                    console.log(d.text);
                    // db.scicheckins.update({key: k}, {$inc: {checkins:1}});
                    Checkins.update({key: d.text}, {$inc: {checkins:1}});
                }
            });

        }))

    });
}