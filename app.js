// NOTE: Requiring express from express
const express = require('express');
// NOTE: Session for data persistence in the browser or database
const session = require('express-session');
// NOTE: Adding the cookie to our database
const MongoStore = require('connect-mongo')(session);
// NOTE: A package to set flash messages (tell the user if there is an error)
const flash = require('connect-flash');
// NOTE: Requiring markedown package
const markdown = require('marked');
// NOTE: Package to sanitize html coming from the frontend so we don't get malicious js
const sanitizeHTML = require('sanitize-html');
// A package to stop csrf
const csrf = require('csurf');
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
    // Setting how long the cookie will be saved in the browser
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  },
});

// NOTE: Telling express app to use session
app.use(sessionOptions);
// NOTE: Telling express to use flash
app.use(flash());

// NOTE: Creating a middleware function to use for all routes user verifications
// The res. locals property is an object that contains response local variables scoped to the request and because of this, it is only available to the view(s) rendered during that request/response cycle
//! Must always be before the router constant to work
app.use(function (req, res, next) {
  // NOTE: Make our markdown funcion available from within ejs templates
  res.locals.filterUserHTML = (content) => {
    return sanitizeHTML(markdown(content), {
      allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      allowedAttributes: {},
    });
  };
  // NOTE: Make all errors and success flash messages available from all templates
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');
  // NOTE: Make current user ID available on the request object
  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }

  // NOTE: Make user session data available from within view templates
  res.locals.user = req.session.user;
  next();
});

// NOTE: Requiring router form router file
const router = require('./router');
const { Socket } = require('net');

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

// NOTE: Cross site request forgery prevention
app.use(csrf());

app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// NOTE: Telling express to use the router functions from the router.js file
app.use('/', router);

// Handling the error from the csrf cross site attacks
//!The csrfToken is added to all the routes in the sites html forms and in some axios requests in js files
app.use(function (err, req, res, next) {
  if (err) {
    if (err.code == 'EBADCSRFTOKEN') {
      req.flash('errors', 'Cross site request forgery detected');
      req.session.save(() => {
        res.redirect('/');
      });
    } else {
      res.render('404');
    }
  }
});

// Requirering the http obj from node.js and calling a createServer method nad passing the express app to it
const server = require('http').createServer(app);

const io = require('socket.io')(server);

// Leting socket use the session obj from express so we have access to the current user
io.use((socket, next) => {
  sessionOptions(socket.request, socket.request.res, next);
});

// Open a connection to the socket.io
// called in chat.js file
io.on('connection', function (socket) {
  // receiving the message from the browser

  // Only if the user is logged in
  if (socket.request.session.user) {
    // Getting the logged in user full info
    let user = socket.request.session.user;

    socket.emit('welcome', { username: user.username, avatar: user.avatar });

    socket.on('chatMessageFromBrowser', (data) => {
      //? socket.emit() is to be used if i want to send the message to the browser that sent me the message (one on one chat)

      // io.emit() is to send the message to all connected parties including yourself
      // socket.broadcast.emit() is to send the message to all connected parties except yourself
      socket.broadcast.emit('chatMessageFromServer', {
        message: sanitizeHTML(data.message, { allowedTags: [], allowedAttributes: {} }),
        username: user.username,
        avatar: user.avatar,
      });
    });
  }
});

// NOTE: exporting the express app from the server variable to be launched from the database db.js
// The server variable now powers the express app and the socket.io
// module.exports = app;
module.exports = server;
