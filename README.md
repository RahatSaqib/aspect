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


##Stress test with siege
Install siege: http://jason.pureconcepts.net/2011/09/installing-siege-mac-os-x-lion/

To test the auth endpoint, run this command:
siege --concurrent=25 --content-type="application/json" 'http://localhost:8080/api/auth POST { "name": "sbaumgartner", "password": "test07", "clientName": "SIEGE", "clientId": "1234" }'


##Deploying
We're serving the API through AWS beanstalk. Install the eb cli tools and commit changes, then:

```bash
eb deploy aspect-api-dev
eb open
```
