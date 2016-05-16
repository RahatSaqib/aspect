# Aspect API

This is the web api for all aspect clients. 
It's using express as the middleware and JWT (jwt.io) for authentication.

##Installation
Clone the repository, then:

```bash
# Install dependencies
npm install
```

Then, set up secret and db connection string in config.js

It's best to install nodemon globally and use that to run the project so that the server restarts automatically on any change:

```bash
nodemon
```



##Routes

```GET '/'```: Will return hello! (for testing)

```POST '/api/auth'```: Send name, password, client_id, and client_name in x-www-form-urlencoded format and if credentials are OK returns a JWT.

```POST '/api/auth/refresh'```: Post a refresh token in the "x-access-token" header, and this endpoint will return a refreshed JWT.

```GET '/api/auth'```: When valid JWT is in header, returns a welcome-message (for testing that auth works)



##Tests
Tests are in /test and written in Mocha/Chai
To run tests, start the server and then run `mocha` or `npm test` in another terminal

##Deploying
We're serving the API through AWS beanstalk. Install the eb cli tools and commit changes, then:

eb deploy aspect-api-dev
eb open
