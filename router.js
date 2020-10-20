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

//? Posts related routes
// NOTE: Using the create posts function from the postController.js
router.get('/create-post', postController.viewCreateScreen);

module.exports = router;
