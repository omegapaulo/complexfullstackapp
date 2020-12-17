import Axios from 'axios';

export default class RegistrationForm {
  constructor() {
    // Grabing the csrf token from the html file
    this._csrf = document.querySelector('[name="_csrf"]').value;
    this.form = document.querySelector('#registration-form');
    this.allFields = document.querySelectorAll('#registration-form .form-control');
    this.insertValidationElement();
    this.username = document.querySelector('#username-register');
    this.username.previousValue = '';
    this.email = document.querySelector('#email-register');
    this.email.previousValue = '';
    this.password = document.querySelector('#password-register');
    this.password.previousValue = '';
    // The email and password are false when page run first so the http req will update these values
    this.username.isUnique = false;
    this.email.isUnique = false;
    this.events();
  }

  //! events
  events() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.formSubmitHandler();
    });

    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler);
    });

    this.email.addEventListener('keyup', () => {
      this.isDifferent(this.email, this.emailHandler);
    });

    this.password.addEventListener('keyup', () => {
      this.isDifferent(this.password, this.passwordHandler);
    });

    // Using onblur event to catch errors when user input loses focus
    this.username.addEventListener('blur', () => {
      this.isDifferent(this.username, this.usernameHandler);
    });

    this.email.addEventListener('blur', () => {
      this.isDifferent(this.email, this.emailHandler);
    });

    this.password.addEventListener('blur', () => {
      this.isDifferent(this.password, this.passwordHandler);
    });
  }

  //! methods
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

  // NOTE: FORM VALIDATION FIELD
  formSubmitHandler() {
    // Running all validations on the form submit
    this.usernameAfterDelay();
    this.usernameImmediately();
    this.emailAfterDelay();
    this.passwordAfterDelay();
    this.passwordImmediately();

    if (this.username.isUnique && !this.username.errors && this.email.isUnique && !this.email.errors && !this.password.errors) {
      // If all the statements are true call the submit method on the form
      this.form.submit();
    }
  }

  // NOTE: USERNAME VALIDATION FIELD

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

    // creating errors property to the elem and set it to true
    elem.errors = true;
  }

  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValdationError(this.username, 'Username must be at least 3 characters');
    }

    // check if the username exists already in the db but only after all the errors check has passed
    if (!this.username.errors) {
      //! Using csrf in here with axios request
      Axios.post('/doesUsernameExist', { _csrf: this._csrf, username: this.username.value })
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

  // NOTE: EMAIL FIELD VALIDATION

  emailHandler() {
    // creating a errors property to the elem and set it to false
    this.email.errors = false;
    // code to run after a certain delay (when the user stops typing for a certain period of time)
    clearTimeout(this.email.timer);
    // creating a timer property in the email method and set it to a timeout function
    this.email.timer = setTimeout(() => {
      this.emailAfterDelay();
    }, 800);

    console.log(this.email);
  }

  emailAfterDelay() {
    // Checking if email has valid characters
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValdationError(this.email, 'You must provide a valid email');
    }

    // Checking the db if the email is allready in use
    if (!this.email.errors) {
      //! Using the csrf with Axios request here
      Axios.post('/doesEmailExist', { _csrf: this._csrf, email: this.email.value })
        .then((response) => {
          if (response.data) {
            this.email.isUnique = false;
            this.showValdationError(this.email, 'This email already exists');
          } else {
            this.email.isUnique = true;
            this.hideValdationError(this.email);
          }
        })
        .catch((err) => {
          console.log(err, 'server error');
        });
    }
  }

  // NOTE: PASSWORD FIELD VALIDATION

  passwordHandler() {
    // creating a errors property to the elem and set it to false
    this.password.errors = false;
    // code to run immediately when invalid character is added
    this.passwordImmediately();
    // code to run after a certain delay (when the user stops typing for a certain period of time)
    clearTimeout(this.password.timer);
    // creating a timer property in the password method and set it to a timeout function
    this.password.timer = setTimeout(() => {
      this.passwordAfterDelay();
    }, 800);

    console.log(this.password);
  }

  passwordImmediately() {
    if (this.password.value.length > 30) {
      this.showValdationError(this.password, 'Password can not be less than 30 characters');
    }

    if (!this.password.errors) {
      this.hideValdationError(this.password);
    }
  }

  passwordAfterDelay() {
    if (this.password.value.length < 8) {
      this.showValdationError(this.password, 'Password must be at least 8 characters');
    }
  }
}
