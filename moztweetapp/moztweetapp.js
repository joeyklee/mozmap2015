Tweet = new Meteor.Collection("scitweet");

if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault('counter', 0);

    Template.hello.helpers({
        counter: function() {
            return Session.get('counter');
        }
    });

    Template.hello.events({
        'click button': function() {
            // increment the counter when button is clicked
            Session.set('counter', Session.get('counter') + 1);
        }
    });

}


if (Meteor.isServer) {
    Meteor.startup(function() {
        // code to run on server at startup
        var Twit = Meteor.npmRequire('twit');
        var Fiber = Meteor.npmRequire('fibers');

        var T = new Twit({
            consumer_key: '', // API key
            consumer_secret: '', // API secret
            access_token: '',
            access_token_secret: ''
        })
        

        var stream = T.stream('statuses/filter', {
            track: ['openscience', 'notopenscience', 'icanhazpdf', 'opendata', 'openresearch']
        })

        stream.on('tweet', Meteor.bindEnvironment(function(tweet) {
            console.log(tweet)
            Tweet.insert(tweet);
        }))

    });
}