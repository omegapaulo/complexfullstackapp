const apiRouter = require('express').Router();
//NOTE: Getting the functions from controllers folder in the userCotroller file
const userController = require('./controllers/userController');
//NOTE: Getting the functions from controllers folder in the postCotroller file
const postController = require('./controllers/postController');
//NOTE: Getting the functions from controllers folder in the followCotroller file
const followController = require('./controllers/followController');
const cors = require('cors');

// NOTE: adding cors policy in our domain for public use
// apiRouter.use(cors());

apiRouter.post('/login', userController.apiLogin);
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate);
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete);
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername);

module.exports = apiRouter;
