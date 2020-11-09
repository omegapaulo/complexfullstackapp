// NOTE: Requiring the user constructor function from the models folder
const User = require('../models/User');
// NOTE: Requiring the post constructor function from the models folder
const Post = require('../models/Posts');
// NOTE: Requiring the follow constructor function from the models folder
const Follow = require('../models/Follow');

// NOTE: A function to check if current user is following other profile or not
// It will run for a profile routes. ex: posts route, followers route, following route
exports.sharedProfileData = async function (req, res, next) {
  let isVisitorsProfile = false;
  let isFollowing = false;

  // If the current user is logged in
  if (req.session.user) {
    // Getting the current mongodb id object for the current profile user
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);

    // Check to see if the current user is following the current visiting profile
    // set isFollowing variable to
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
  }
  // Storing the boolean the isVisitorsProfile profile id from the database to the request isVisitorsProfile object
  req.isVisitorsProfile = isVisitorsProfile;

  // Storing the boolean of the local isFollowing to the request isFollowing object
  req.isFollowing = isFollowing;
  // retrieve Posts, following and followers counts
  const postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  const followerCountPromise = Follow.countFollowersById(req.profileUser._id);
  const followingCountPromise = Follow.countFollowingById(req.profileUser._id);
  // Destructuring the Promise.all
  const [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);

  // Adding the destructuring variables to the req (request) object
  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;

  // Use the stored boolean value fro the request isFollowing object to the next() function
  //  Call the next function
  next();
};

// NOTE: A function to check if the user is logged in or not to protect
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

exports.home = async function (req, res) {
  // NOTE: If user is verified then the web browser remember the user info
  // NOTE: If user is logged in then render home-dashboard
  if (req.session.user) {
    // Fetching users feed of posts for the current user
    const posts = await Post.getFeed(req.session.user._id);
    // NOTE: rendering the dashboard
    res.render('home-dashboard', { posts: posts });
  } else {
    // NOTE:Rendering the home page plus error messages from error array in the User.js file with the flush package and show it to the user if the login is incorrect or the register is empty
    res.render('home-guest', { registerFormErrors: req.flash('registerFormErrors') });
  }
};

// NOTE: User profile screen, showing the useer's profile
exports.ifUserExists = function (req, res, next) {
  // console.log(req.params.username);
  // NOTE: Finding the user by username from the request of the browser
  User.findByUsername(req.params.username)
    .then(function (userDocument) {
      // console.log(userDocument);
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
        // NOTE: receiving the user data and manipulate it to the profile page template
        currentPage: 'posts',
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount },
      });
      // console.log(req.postCount);
    })
    .catch(function () {
      res.render('404');
    });
};

// NOTE: User profile followers screen, showing who's is following me
exports.profileFollowersScreen = async function (req, res) {
  try {
    const followers = await Follow.getFollowersById(req.profileUser._id);

    res.render('profile-followers', {
      currentPage: 'followers',
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount },
    });
  } catch (error) {
    res.render('404');
  }
};

// NOTE: User profile following screen, showing who  I am following
exports.profileFollowingScreen = async function (req, res) {
  try {
    const following = await Follow.getFollowingById(req.profileUser._id);

    res.render('profile-following', {
      currentPage: 'following',
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount },
    });
  } catch (error) {
    res.render('404');
  }
};
