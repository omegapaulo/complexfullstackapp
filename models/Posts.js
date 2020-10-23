// Accessing the mongo db to be used in this file
const postsCollection = require('../db').db().collection('posts');
// NOTE: Mongodb ID object to be used as best practices
const ObjectID = require('mongodb').ObjectID;

const User = require('./User');

const Post = function (data, userId) {
  this.data = data;
  this.errors = [];
  this.userId = userId;
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

// NOTE: mongodb code to filter user avatar and user username and display into ui
Post.findSingleById = function (id) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject();
      return;
    }
    let posts = await postsCollection
      .aggregate([
        { $match: { _id: new ObjectID(id) } },
        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument' } },
        {
          $project: {
            title: 1,
            body: 1,
            createdDate: 1,
            author: { $arrayElemAt: ['$authorDocument', 0] },
          },
        },
      ])
      .toArray();
    // clean up author property in each post object
    posts = posts.map(function (post) {
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
      };

      return post;
    });

    if (posts.length) {
      console.log(posts[0]);
      resolve(posts[0]);
    } else {
      reject();
    }
  });
};

module.exports = Post;
