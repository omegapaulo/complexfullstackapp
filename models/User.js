// NOTE: Password hashing package
const bcrypt = require('bcryptjs');
// NOTE: Connecting to the database and getting the users collection
const usersCollection = require('../db.js').db().collection('users');
// NOTE: A package to validate user inputs
const validator = require('validator');
// NOTE: A package to get gravatar images
const md5 = require('md5');

// console.log(usersCollection);

const User = function (data, getAvatar) {
  // NOTE: Receiving the user input data from the userController.js file
  this.data = data;
  // NOTE: Receiving all the errors and pushing it to the array
  this.errors = [];
  if (getAvatar == undefined) {
    getAvatar = false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
};

User.prototype.cleanUp = function () {
  // NOTE: Setting the incoming data to a string if getting an obj or array
  if (typeof this.data.username != 'string') {
    this.data.username = '';
  }
  if (typeof this.data.email != 'string') {
    this.data.email = '';
  }
  if (typeof this.data.password != 'string') {
    this.data.password = '';
  }

  //NOTE: Get rid of any bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  };
};

User.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    // NOTE: Checking if input fields are empty
    if (this.data.username == '') {
      this.errors.push('You must provide a username.');
    }
    if (this.data.password == '') {
      this.errors.push('You must provide a password.');
    }
    // NOTE: Validating the username if is all alphabetic and numeric characters with validator package
    if (this.data.username != '' && !validator.isAlphanumeric(this.data.username)) {
      this.errors.push('Username can only contain letters and numbers.');
    }
    // NOTE: Validating the username if email field has valid email characters with validator package
    if (!validator.isEmail(this.data.email)) {
      this.errors.push('You must provide a valid email address.');
    }
    // NOTE: Checking for password and username length
    if (this.data.password.length > 0 && this.data.password.length < 5) {
      this.errors.push('Password must be at least 12 characters.');
    }
    if (this.data.password.length > 40) {
      this.errors.push('Password cannot exceed 40 characters.');
    }
    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push('Username must be at least 3 characters.');
    }
    if (this.data.username.length > 30) {
      this.errors.push('Username cannot exceed 30 characters.');
    }

    // NOTE: check if username input is already taken but only if it is a valid one
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      // NOTE: checking the database if the info already exists but waiting until the second if statement finish
      let usernameExists = await usersCollection.findOne({ username: this.data.username });
      if (usernameExists) {
        this.errors.push('That username is already taken');
      }
    }

    // NOTE: check if email input is already taken but only if it is a valid one
    if (validator.isEmail(this.data.email)) {
      // NOTE: checking the database if the info already exists but waiting until the second if statement finish
      let userEmailExists = await usersCollection.findOne({ email: this.data.email });
      if (userEmailExists) {
        this.errors.push('That email is already being used');
      }
    }
    resolve();
  });
};

User.prototype.login = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    // NOTE: Using the arrow function here so that the THIS KEYWORD will point to the user password
    usersCollection
      .findOne({ username: this.data.username })
      .then((attemptedUser) => {
        // console.log(attemptedUser);
        // NOTE: Compare the hash password with the bcryptjs
        if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
          this.data = attemptedUser;
          // console.log(this.data);
          this.getAvatar();
          resolve('congrats');
        } else {
          reject('Invalid username and password');
        }
      })
      .catch(function (err) {
        // NOTE: if the database fails
        reject('Please try again later');
      });
  });
};

User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    // NOTE: Validate user input data
    this.cleanUp();
    await this.validate();
    // console.log(this.data);
    // NOTE: If there are no validation errors save the data to the database
    if (!this.errors.length) {
      // NOTE: Hash user password
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      // NOTE: Inserting the data to the database after hashing
      await usersCollection.insertOne(this.data);
      this.getAvatar();
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

User.prototype.getAvatar = function () {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
};

module.exports = User;
