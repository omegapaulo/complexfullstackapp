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
    let post = await Post.findSingleById(req.params.id);
    res.render('single-post-screen', { post: post });
  } catch (error) {
    res.render('404');
  }
};
