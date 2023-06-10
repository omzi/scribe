import axios from 'axios';

export default class RegistrationForm {
  constructor() {
    this._csrf = document.querySelector('[name="_csrf"]').value;
    this.form = document.getElementById('registration-form');
    this.allFields = document.querySelectorAll('#registration-form .form-control');
    this.insertValidationElements();
    this.username = document.getElementById('username-register');
    this.username.previousValue = '';
    this.email = document.getElementById('email-register');
    this.email.previousValue = '';
    this.password = document.getElementById('password-register');
    this.password.previousValue = '';
    this.username.isUnique = false;
    this.email.isUnique = false;
    this.events();
  }

  // Events
  events() {
    this.username.addEventListener('input', e => {
      this.isDifferent(e.target, this.usernameHandler);
    })
    this.email.addEventListener('input', e => {
      this.isDifferent(e.target, this.emailHandler);
    })
    this.password.addEventListener('input', e => {
      this.isDifferent(e.target, this.passwordHandler);
    })
    this.form.addEventListener('submit', e => {
      e.preventDefault(); this.formSubmitHandler();
    })
  }

  // Methods
  formSubmitHandler() {
    this.usernameImmediately();
    this.usernameAfterDelay();
    this.emailAfterDelay();
    this.passwordImmediately();
    this.passwordAfterDelay();

    if (
      this.username.isUnique &&
      !this.username.errors &&
      this.email.isUnique &&
      !this.email.errors &&
      !this.password.errors
    ) {
      this.form.submit();
    }
  }

  isDifferent(element, handler) {
    if (element.previousValue != element.value) handler.call(this);
    element.previousValue = element.value;
  }

  usernameHandler() {
    this.username.errors = false;
    this.usernameImmediately();
    clearTimeout(this.username.timer);
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 750);
  }

  emailHandler() {
    this.email.errors = false;
    clearTimeout(this.email.timer);
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 750);
  }

  passwordHandler() {
    this.password.errors = false;
    this.passwordImmediately();
    clearTimeout(this.password.timer);
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 750);
  }

  usernameImmediately() {
    if (this.username.value.length >= 3 && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(this.username, 'Username can only contain letters & numbers.');
    }

    if (this.username.value.length > 30) {
      this.showValidationError(this.username, 'Username cannot exceed 30 characters.');
    }

    if (!this.username.errors) this.hideValidationError(this.username);
  }

  passwordImmediately() {
    if (this.password.value.length > 36) {
      this.showValidationError(this.password, 'Password cannot exceed 36 characters.');
    }

    if (!this.password.errors) this.hideValidationError(this.password);
  }

  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValidationError(this.username, 'Username must be at least 3 characters.');
    }

    if (!this.username.errors) {
      axios.post('/doesUsernameExist', {
        _csrf: this._csrf,
        username: this.username.value
      }).then(response => {
          if (response.data) {
            this.showValidationError(this.username, 'Oops! Username has been taken.');
            this.username.isUnique = false;
          } else {
            this.username.isUnique = true;
          }
        }).catch(() => console.log('Please try again later!'));
    }
  }

  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(this.email, 'You must provide a valid email address.');
    }

    if (!this.email.errors) this.hideValidationError(this.email);

    if (!this.email.errors) {
      axios.post('/doesEmailExist', {
        _csrf: this._csrf,
        email: this.email.value
      }).then(response => {
          if (response.data) {
            this.showValidationError(this.email, 'Oops! Email address is already being used.');
            this.email.isUnique = false;
          } else {
            this.email.isUnique = true;
          }
        }).catch(() => console.log('Please try again later!'));
    }
  }

  passwordAfterDelay() {
    if (this.password.value.length < 6) {
      this.showValidationError(this.password, 'Password must be at least 6 characters.');
    }
  }

  showValidationError(element, message) {
    element.nextElementSibling.innerHTML = message;
    element.nextElementSibling.classList.remove('liveValidateMessage--invisible');
    element.nextElementSibling.classList.add('liveValidateMessage--visible');
    element.errors = true;
  }

  hideValidationError(element) {
    element.nextElementSibling.classList.remove('liveValidateMessage--visible');
    element.nextElementSibling.classList.add('liveValidateMessage--invisible');
  }

  insertValidationElements() {
    this.allFields.forEach(element => {
      element.insertAdjacentHTML('afterend', `<div class="alert alert-danger small liveValidateMessage liveValidateMessage--invisible"></div>`);
    })
  }
}