module.exports = {
  url: process.env.ASPECT_URL,
  elements: {
    textField: {
      selector: 'input[type=text]',
    },
    passwordField: {
      selector: 'input[type=password]',
    },
    submit: {
      selector: 'button[type=submit]',
    },
    logo: {
      selector: 'img[alt=Aspect]',
    },
    h3Title: {
      selector: 'h3',
    },
    forgotPasswordLink: {
      selector: 'a',
    },
  },
}
