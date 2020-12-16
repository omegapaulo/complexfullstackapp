import Axios from 'axios';

export default class RegistrationForm {
  constructor() {
    this.allFields = document.querySelectorAll('#registration-form .form-control');
    this.insertValidationElement();
    this.username = document.querySelector('#username-register');
    this.username.previousValue = '';
    this.events();
  }

  // events
  events() {
    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler);
    });
  }

  // methods
  // ? Reusable function for the validation
  isDifferent(elem, usernameHandler) {
    // check if the input value has changed
    // if the previousValue not equal current value
    if (elem.previousValue != elem.value) {
      // call usernameHandler function and add call method to it so the THIS key word point to the overall object
      usernameHandler.call(this);
    }
    // set previous value to current value
    elem.previousValue = elem.value;
  }

  usernameHandler() {
    // creating a errors property to the elem and set it to false
    this.username.errors = false;
    // code to run immediately when invalid character is added
    this.usernameImmediately();
    // code to run after a certain delay (when the user stops typing for a certain period of time)
    clearTimeout(this.username.timer);
    // creating a timer property in the username method and set it to a timeout function
    this.username.timer = setTimeout(() => {
      this.usernameAfterDelay();
    }, 800);

    console.log(this.username);
  }

  usernameImmediately() {
    // checking the input value in username inputfield
    if (this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValdationError(this.username, 'Username can only contain letters and numbers');
    }

    if (this.username.value.length > 30) {
      this.showValdationError(this.username, 'Username can not be over 30 characters');
    }

    // checking if the error in input field is removed
    if (!this.username.errors) {
      this.hideValdationError(this.username);
    }
  }

  hideValdationError(elem) {
    elem.nextElementSibling.classList.remove('liveValidateMessage--visible');
  }

  showValdationError(elem, message) {
    elem.nextElementSibling.innerHTML = message;
    elem.nextElementSibling.classList.add('liveValidateMessage--visible');

    // creating a errors property to the elem and set it to true
    elem.errors = true;
  }

  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValdationError(this.username, 'Username must be at least 3 characters');
    }

    // check if the username exists already in the db but only after all the errors check has passed
    if (!this.username.errors) {
      Axios.post('/doesUsernameExist', { username: this.username.value })
        .then((response) => {
          if (response.data) {
            this.showValdationError(this.username, 'That username is already taken');
            this.username.isUnique = false;
          } else {
            this.username.isUnique = true;
          }
        })
        .catch((error) => {
          console.log(error, 'Please try it later');
        });
    }
  }

  insertValidationElement() {
    this.allFields.forEach((elem) => {
      elem.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>');
    });
  }
}
