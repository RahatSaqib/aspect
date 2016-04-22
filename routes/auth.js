let express = require('express');
let jwt = require('jsonwebtoken');

let jwtmiddleware = require('./jwtmiddleware')

module.exports = function (secret) {

  let routes = express.Router();

  // route to authenticate a user
  routes.post('/', function (req, res) {

    // TODO: find the user in the db, make sure he has access to audience
    let user = { name: req.body.name, password: req.body.password };

    if (!user) {
      res.status(401).json({ message: 'Authentication failed. User not found.' });
    } else if (user) {

      // TODO: check if password matches
      if (user.name !== user.password) {
        res.status(401).json({ message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right create a token
        let token = jwt.sign(user, secret, {
          expiresInMinutes: 60 // expires in 1 hour
        });

        // TODO: Add audience to token

        // TODO: Fill token with roles/fullname of user

        // return the information including token as JSON
        res.json({
          token: token
        });
      }

    }
  });

  // route for refreshing a token
  routes.put('/', function (req, res) {

    // check header or url parameters or post parameters for token
    let token = req.headers['x-access-token'];

    // decode token
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, secret, function (err) {
        if (err) {
          return res.status(401).json({ message: 'Failed to authenticate token.' });
        } else {
          // if everything is good, return the refreshed token
          let originalDecoded = jwt.decode(token, { complete: true });

          let refreshedToken = jwt.sign(originalDecoded.payload, secret, {
            expiresInMinutes: 60 // expires in 1 hour
          });

          res.json({
            token: refreshedToken
          });
        }
      });

    } else {

      return res.status(403).send({
        message: 'No token provided.'
      });

    }
  });

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, secret));

  // route to test that token works
  routes.get('/', function (req, res) {
    res.json({ message: 'Welcome to the coolest API on earth! Looks like you have a valid token!' });
  });

  return routes;
}
