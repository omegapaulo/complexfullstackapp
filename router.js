//NOTE: Requiring express from express
const express = require('express');
//NOTE: Requiring router form express router
const router = express.Router();
//NOTE: Getting the functions from controllers folder in the userCotroller file
const userController = require('./controllers/userController');
//NOTE: Getting the functions from controllers folder in the postCotroller file
const postController = require('./controllers/postController');

//? User related routes
//NOTE: Using the home function from the userController file
router.get('/', userController.home);
//NOTE: Using the register function from the userController file
router.post('/register', userController.register);
//NOTE: Using the login function from the userController file
router.post('/login', userController.login);
//NOTE: Using the logout function from the userController file
router.post('/logout', userController.logout);

//? Profile related routes
//NOTE: Using the profile function from the userController file
router.get('/profile/:username', userController.ifUserExists, userController.profilePostsScreen);

//? Posts related routes
// NOTE: Using the create posts function from the postController.js
// mustBeLoggedIn is a function that controls if the user exists or not
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen);
// NOTE: Submiting posts, calling the function from postController file
router.post('/create-post', userController.mustBeLoggedIn, postController.create);
// NOTE: viewing single posts
router.get('/post/:id', postController.viewSingle);
// NOTE: editing single posts
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen);
// NOTE: submiting the edited single posts
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit);
// NOTE: Deleting posts
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete);

module.exports = router;
