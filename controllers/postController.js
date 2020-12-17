const Post = require('../models/Posts');

exports.viewCreateScreen = function (req, res) {
  res.render('create-post');
};

exports.create = function (req, res) {
  // NOTE: Getting the user ID from the userController.js file
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then(function (newId) {
      req.flash('success', 'New post successfully created.');
      req.session.save(() => {
        res.redirect(`/post/${newId}`);
      });
    })
    .catch(function (errors) {
      errors.forEach((error) => {
        req.flash('errors', error);
      });
      // Saving the session and redirect
      req.session.save(() => {
        res.redirect('/create.post');
      });
    });
};

// API code starts here
//!
exports.apiCreate = function (req, res) {
  // NOTE: Getting the user ID from the userController.js file
  let post = new Post(req.body, req.apiUser._id);
  post
    .create()
    .then(function (newId) {
      // If we are really creating an real API we must pass in the newId in the res.json
      // res.json(newId)
      res.json('Congrats.');
    })
    .catch(function (errors) {
      res.json(errors);
    });
};

exports.apiDelete = function (req, res) {
  // Passing the post id to be deleted and the api user id
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json('Success');
    })
    .catch(() => {
      res.json('You do not have permission to perform this action');
    });
};
// API code ends here

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    // title property is set to work with the html header title tag
    res.render('single-post-screen', { post: post, title: post.title });
  } catch (error) {
    res.render('404');
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      res.render('edit-post', { post: post });
    } else {
      req.flash('errors', 'You do not have permission to perform that action.');
      req.session.save(() => res.redirect('/'));
    }
  } catch {
    res.render('404');
  }
};

//! THis code is not valid amymore
// exports.viewEditScreen = async function (req, res) {
//   try {
//     const post = await Post.findSingleById(req.params.id);
//     // console.log(post);
//     // Allowing the visitor to see the edit screen or not
//     if (post.authorId == req.visitorId) {
//       res.render('edit-post', { post: post });
//     } else {
//       req.flash('errors', "You don't have permission for this action");
//       // Saving the session data manually and redirect them
//       req.session.save(() => {
//         res.redirect('/');
//       });
//     }
//   } catch (error) {
//     res.render('404');
//   }
// };

exports.edit = async function (req, res) {
  const post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    // the status param receive the result from the update function
    .then((status) => {
      // console.log(status);
      // the post was successfully updated in the database
      // or user did have permission, but there were validations errors
      if (status == 'success') {
        // post was updated
        req.flash('success', 'Post successfully updated');
        // Saving the session data manually and redirect them
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      } else {
        // show them the error
        post.errors.forEach((error) => {
          req.flash('errors', error);
        });
        // Saving the session data manually and redirect them
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      }
    })
    .catch(() => {
      // if post with the requested id don't exist
      // or if the current visitor is not the owner of the requested post
      req.flash('errors', 'You have no permission to perform this action');
      // Saving the session data manually and redirect them
      req.session.save(() => {
        res.redirect('/');
      });
    });
};

exports.delete = function (req, res) {
  // Passing the post id to be deleted and the visitor
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash('success', 'Post successfully deleted');
      req.session.save(() => {
        res.redirect(`/profile/${req.session.user.username}`);
      });
    })
    .catch(() => {
      req.flash('errors', 'You do not have permission to perform this action');
      req.session.save(() => {
        res.redirect('/');
      });
    });
};

// Searching for posts and deliver them the browser
exports.search = function (req, res) {
  Post.search(req.body.searchTerm)
    .then((posts) => {
      res.json(posts);
    })
    .catch(() => {
      res.json([]);
    });
};
