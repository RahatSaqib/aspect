let jwt = require('jsonwebtoken')

module.exports = function (req, res, next, secret) {

  // check header or url parameters or post parameters for token
  let token = req.body.token ||
              req.query.token ||
              req.headers['x-access-token'] ||
              req.headers['Authorization'] ||
              req.headers['authorization']
  // decode token
  if (token) {

    // if sent in authorization-header, remove bearer:
    token = token.replace('Bearer ', '')

    // verify secret and check expiration date
    jwt.verify(token, secret, function (err, decoded) {
      if (err) {
        return res.status(401).json({ message: 'Token error: ' + err.message })
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded
        next()
      }
    })

  } else {

    // if there is no token return an error
    return res.status(403).send({
      message: 'No token provided'
    })

  }
}
