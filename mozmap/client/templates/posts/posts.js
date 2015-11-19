Template.postsList.helpers({
    posts: function() {
        return Tweet.find();
    }
});