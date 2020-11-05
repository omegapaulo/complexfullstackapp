const Post = require('../models/Posts');

exports.viewCreateScreen = function (req, res) {
  res.render('create-post');
};

exports.create = function (req, res) {
  // NOTE: Getting the user ID from the userController.js file
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then(function () {
      res.send('new post created');
    })
    .catch(function (errors) {
      res.send(errors);
    });
};

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render('single-post-screen', { post: post });
  } catch (error) {
    res.render('404');
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    const post = await Post.findSingleById(req.params.id);
    // console.log(post);
    res.render('edit-post', { post: post });
  } catch (error) {
    res.render('404');
  }
};

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
