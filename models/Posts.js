// Accessing the mongo db to be used in this file
const postsCollection = require('../db').db().collection('posts');
// NOTE: Mongodb ID object to be used as best practices
const ObjectID = require('mongodb').ObjectID;

const User = require('./User');

const Post = function (data, userId, requestedPostId) {
  this.data = data;
  this.errors = [];
  this.userId = userId;
  this.requestedPostId = requestedPostId;
};

Post.prototype.cleanUp = function () {
  // NOTE: Making sure the posts are all in strings
  if (typeof this.data.title != 'string') {
    this.data.title = '';
  }
  if (typeof this.data.body != 'string') {
    this.data.body = '';
  }

  // NOTE: Making sure no bogus properties are included with the posts
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createdDate: new Date(),
    author: ObjectID(this.userId),
  };
};

Post.prototype.validate = function () {
  // NOTE: Forcing the user to not leave title or body of posts empty
  if (this.data.title == '') {
    this.errors.push('You must provide a title.');
  }
  if (this.data.body == '') {
    this.errors.push('You must provide post content.');
  }
};

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      // save post into database
      postsCollection
        .insertOne(this.data)
        .then(() => {
          resolve();
        })
        .catch(() => {
          this.errors.push('Please try again later.');
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const post = await Post.findSingleById(this.requestedPostId, this.userId);
      if (post.isVisitorOwner) {
        // Update post in db
        const status = await this.actuallyUpdate();
        // console.log(status);
        resolve(status);
      } else {
        reject();
      }
    } catch (error) {
      reject();
    }
  });
};

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate({ _id: new ObjectID(this.requestedPostId) }, { $set: { title: this.data.title, body: this.data.body } });
      resolve('success');
    } else {
      resolve('failure');
    }
  });
};

// NOTE: mongodb code to filter user avatar user username user ids and posts and display into ui
// ! This function was created so we don't repeat almost the same code to use in the two function bellow
Post.reUsablePostQuery = function (uniqueOperations, visitorId) {
  return new Promise(async function (resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument' } },
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: '$author',
          author: { $arrayElemAt: ['$authorDocument', 0] },
        },
      },
    ]);

    let posts = await postsCollection.aggregate(aggOperations).toArray();

    // clean up author property in each post object
    posts = posts.map(function (post) {
      // NOTE-. check if visitor is owner of the post
      // NOTE-. equals is a mongodb method that return true or false
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
      };

      return post;
    });
    resolve(posts);
  });
};

// NOTE: mongodb code to filter user avatar and user username and display into ui
// NOTE: visitorId param determines if the user is logged in or not from the postController.js viewSingle function
Post.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject();
      return;
    }

    let posts = await Post.reUsablePostQuery([{ $match: { _id: new ObjectID(id) } }], visitorId);

    if (posts.length) {
      // console.log(posts[0]);
      resolve(posts[0]);
    } else {
      reject();
    }
  });
};

// NOTE: mongodb code to filter user id and user posts and display into ui
Post.findByAuthorId = function (authorId) {
  // NOTE: $sort to sort by ascending or descending order
  // console.log(Post.reUsablePostQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }]));
  return Post.reUsablePostQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }]);
};

module.exports = Post;
