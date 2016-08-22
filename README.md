# Aspect API

This is the web api for all aspect clients. 
It's using express as the middleware and JWT (jwt.io) for authentication.

##Installation
Clone the repository, then:

```bash
# Install dependencies
npm install
```

Then, set up secret and db connection string in config.test.js

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
To run tests, `npm test` in the terminal

###Running tests against a local database
The API is configured to connect to the test AWS RDS database by default and will point to the config.test.js to configure the application
In order to change the config, on your machine, to point to another database you need to set the NODE_ENV variable to something specific
Change the values in ./config.local.js to point to a local database setup on your machine and run the following command
```bash
set NODE_ENV=local
``` 
This will tell the application to point to config.<strong style="color: #0099cc;">local</strong>.js for configuration values
Then run tests using the `npm test` command

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

##Updating Dependencies

To check which dependencies have newer versions available:

```bash
npm outdated
```

To update all to the latest version (this is not the same as the "Wanted" version): 

```bash
npm update --save
```
