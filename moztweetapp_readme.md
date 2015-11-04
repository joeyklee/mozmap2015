# Mozmap Tweet Stream

## Setup:

### Install Meteor (osx):
```
curl https://install.meteor.com/ | sh
```

### First cd to the directory:
```
cd moztweetapp
```

### Install node package manager for the  Meteor project:
```
meteor add meteorhacks:npm
```

### Install the twitter node package from the "package.json":
```
npm install
```

### Add in the twitter api keys and credentials:
<< get them from joey and add them in>>
```
var T = new Twit({
            consumer_key: '', // API key
            consumer_secret: '', // API secret
            access_token: '',
            access_token_secret: ''
});
```


### Run the app:
```
meteor
```


