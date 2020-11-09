const usersCollection = require('../db').db().collection('users');
const followsCollection = require('../db').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');

const Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

Follow.prototype.cleanUp = async function () {
  if (typeof this.followedUsername != 'string') {
    this.followedUsername = '';
  }
};

Follow.prototype.validate = async function (action) {
  // followedUsername must exist in mongodb
  const followedAccount = await usersCollection.findOne({ username: this.followedUsername });
  // If the followedAccount exist then save their user Id
  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push('You cannot follow a user that does not exist');
  }

  // Check if we already following the user by looking it up in the database
  let doesFollowAlreadyExist = await followsCollection.findOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) });

  // If the current action we trying is create
  if (action == 'create') {
    // Make sure the that the current follow matching the two id does  already exist
    if (doesFollowAlreadyExist) {
      this.errors.push('You are already following this user.');
    }
  }

  // If the current action we trying is delete
  if (action == 'delete') {
    // Make sure the that the current follow matching the two id does not already exist
    if (!doesFollowAlreadyExist) {
      this.errors.push('You cannot stop following someone you do not already follow.');
    }
  }

  //? Making sure that you can not follow yourself
  // If the followed id matches the user id, push errors to errors array
  if (this.followedId.equals(this.authorId)) {
    this.errors.push('You cannot follow yourself.');
  }
};

Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    // Passing the create text option so it know what action we trying to perform
    await this.validate('create');

    // If theres no errors in our errors array
    if (!this.errors.length) {
      // Insert a collection to the db
      await followsCollection.insertOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) });
      resolve();
    } else {
      // Otherwise reject with the errors message
      reject(this.errors);
    }
  });
};

Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    // Passing the delete text option so it know what action we trying to perform
    await this.validate('delete');

    // If theres no errors in our errors array
    if (!this.errors.length) {
      // Delete a collection in the db
      await followsCollection.deleteOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) });
      resolve();
    } else {
      // Otherwise reject with the errors message
      reject(this.errors);
    }
  });
};

Follow.isVisitorFollowing = async function (followedId, visitorId) {
  // Check the db to see if there is an existing document where the followed id matchs the current profile id iam viewing
  // And the autor id matchs the current account iam logged in with
  let followDoc = await followsCollection.findOne({ followedId: followedId, authorId: new ObjectID(visitorId) });

  // If we are able to find the matching documents
  if (followDoc) {
    return true;
  } else {
    return false;
  }
};

Follow.getFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      // Using the aggregate mongodb method for more complex queries in search, the toArray method will resolve with an array from the promise of the followsCollection returns
      let followers = await followsCollection
        .aggregate([
          { $match: { followedId: id } },
          { $lookup: { from: 'users', localField: 'authorId', foreignField: '_id', as: 'userDoc' } },
          { $project: { username: { $arrayElemAt: ['$userDoc.username', 0] }, email: { $arrayElemAt: ['$userDoc.email', 0] } } },
        ])
        .toArray();
      followers = followers.map((follower) => {
        // create a user
        let user = new User(follower, true);
        return { username: follower.username, avatar: user.avatar };
      });
      resolve(followers);
    } catch (error) {
      reject();
    }
  });
};

Follow.getFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      // Using the aggregate mongodb method for more complex queries in search, the toArray method will resolve with an array from the promise of the followsCollection returns
      let following = await followsCollection
        .aggregate([
          { $match: { authorId: id } },
          { $lookup: { from: 'users', localField: 'followedId', foreignField: '_id', as: 'userDoc' } },
          { $project: { username: { $arrayElemAt: ['$userDoc.username', 0] }, email: { $arrayElemAt: ['$userDoc.email', 0] } } },
        ])
        .toArray();
      following = following.map((followedUser) => {
        // create a user
        let user = new User(followedUser, true);
        return { username: followedUser.username, avatar: user.avatar };
      });
      resolve(following);
    } catch (error) {
      reject();
    }
  });
};

Follow.countFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    const followerCount = await followsCollection.countDocuments({ followedId: id });
    resolve(followerCount);
  });
};

Follow.countFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    const followingCount = await followsCollection.countDocuments({ authorId: id });
    resolve(followingCount);
  });
};

module.exports = Follow;
