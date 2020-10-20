// NOTE: Requiring express from express
const express = require('express');
// NOTE: Session for data persistence in the browser or database
const session = require('express-session');
// NOTE: A package to set flash messages (tell the user if there is an error)
const flash = require('connect-flash');
// NOTE: Adding the cookie to our database
const MongoStore = require('connect-mongo')(session);
// NOTE: Requiring router form router file
const router = require('./router');
// NOTE: Using express app
const app = express();

// NOTE: Customizing session options
const sessionOptions = session({
  secret: 'omazing',
  // NOTE: saving the cookie to the database
  store: new MongoStore({ client: require('./db.js') }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  },
});

// NOTE: Telling express to use flash
app.use(flash());

// NOTE: Telling express app to use session
app.use(sessionOptions);
// NOTE: Express boiler plate, must use in all express app
// NOTE: tells express to add our user submit data to express so we can use it in request.body
// NOTE: App receives a traditional html form submit
app.use(express.urlencoded({ extended: false }));
// NOTE: App receives a json data format
app.use(express.json());

// NOTE: Serving static files from the public folder with express
app.use(express.static('public'));

// NOTE: Telling express to look inside the views folder for the
app.set('views', 'views');

// NOTE: Telling express to use ejs as template engine
app.set('view engine', 'ejs');

// NOTE: Telling express to use the router functions from the router.js file
app.use('/', router);

// NOTE: exporting the express app to be launched from the database db.js
module.exports = app;
