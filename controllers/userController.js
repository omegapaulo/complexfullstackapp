// NOTE: Requiring the user constructor function from the models folder
const User = require('../models/User');
// NOTE: Requiring the post constructor function from the models folder
const Post = require('../models/Posts');

// NOTE: A function to check if the user is logged in or not
exports.mustBeLoggedIn = function (req, res, next) {
  // If there is a user call next function
  if (req.session.user) {
    next();
  } else {
    req.flash('errors', 'You must be logged in to access this page');
    // Save the session and redirect to home page
    req.session.save(function () {
      res.redirect('/');
    });
  }
};

// NOTE: Sending these function to the homepage via router.js file
exports.login = (req, res) => {
  const user = new User(req.body);
  // NOTE: loging in the user from the user.js
  user
    .login()
    .then(function (result) {
      // NOTE: Trusting the user input to persist in web page
      req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id };
      // NOTE: Telling the app to save the session before redirecting it to the home page with this callback
      req.session.save(function () {
        res.redirect('/');
      });
    })
    .catch(function (err) {
      req.flash('errors', err);
      // NOTE: Telling the app to save the session before redirecting it to the home page with this callback
      req.session.save(function () {
        res.redirect('/');
      });
    });
};

exports.logout = (req, res) => {
  // NOTE: Destroying all the session info upon logout
  req.session.destroy(function () {
    res.redirect('/');
  });
};

exports.register = (req, res) => {
  // NOTE: Using the User function to create a new user
  let user = new User(req.body);
  // NOTE: Registering the new user from the user.js
  user
    .register()
    .then(() => {
      // NOTE: Destructuring the req.session.user object
      req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id };
      // console.log(req.session.user);
      req.session.save(function () {
        res.redirect('/');
      });
    })
    .catch((registerFormErrors) => {
      registerFormErrors.forEach(function (error) {
        req.flash('registerFormErrors', error);
      });
      // NOTE: Telling the app to save the session before redirecting it to the home page with this callback
      req.session.save(function () {
        res.redirect('/');
      });
    });
};

exports.home = function (req, res) {
  // NOTE: If user is verified then the web browser remember the user info
  if (req.session.user) {
    // NOTE: rendering the dashboard
    res.render('home-dashboard');
  } else {
    // NOTE:Rendering the home page plus error messages from error array in the User.js file with the flush package and show it to the user if the login is incorrect or the register is empty
    res.render('home-guest', { errors: req.flash('errors'), registerFormErrors: req.flash('registerFormErrors') });
  }
};

// NOTE: User profile screen, showing the useer's profile
exports.ifUserExists = function (req, res, next) {
  console.log(req.params.username);
  // NOTE: Finding the user by username from the request of the browser
  User.findByUsername(req.params.username)
    .then(function (userDocument) {
      console.log(userDocument);
      // NOTE: creating a new profileUser property inside the request and store the userDocument into it to pass in another function
      req.profileUser = userDocument;
      next();
    })
    .catch(function (error) {
      res.render('404');
    });
};

// NOTE: User profile posts screen, showing the useer's profile posts
exports.profilePostsScreen = function (req, res) {
  // NOTE: Ask our post model for posts by user ids
  Post.findByAuthorId(req.profileUser._id)
    .then(function (posts) {
      // NOTE: Receiving the userDocument stored in the request object  and passing it to the render function as and object and passing them to the profile.ejs templöate
      res.render('profile', {
        // NOTE: receiving the user posts and display it to ui
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
      });
    })
    .catch(function () {
      res.render('404');
    });
};
