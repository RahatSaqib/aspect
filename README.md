# Aspect API

This is the web api for all aspect clients.


##Installation
Clone the repository, then:

```bash
# Install dependencies
npm install
```

###Environment Configuration
Then add a .env file to the root of the application (inline with server.js) and add your environment config to it
```
secret=Any_Random_String

passwordAttempts=5

db.connectionLimit=100
db.host=localhost
db.user=aspectapi
db.password=your_local_database_password
db.databaseName=aspect
db.debug=false
```

It's best to install nodemon globally and use that to run the project so that the server restarts automatically on any change:

```bash
nodemon
```


##Routes

`GET '/'`: Will return hello! (for testing)

`POST '/api/auth'`: Send name, password, client_id, and client_name in x-www-form-urlencoded format and if credentials are OK returns a JWT.

`POST '/api/auth/refresh'`: Post a refresh token in the "x-access-token" header, and this endpoint will return a refreshed JWT.

`GET '/api/auth'`: When valid JWT is in header, returns a welcome-message (for testing that auth works)


### Example

```bash
$ curl localhost:8080
Hello! The API is at /api.

$ curl localhost:8080/api/auth
{"message":"No token provided"}

$ curl -X POST --data 'name=bob&password=pass&clientName=Acme' localhost:8080/api/auth
# Edited to remove long tokens
{
    "access": "${jwt_token}"
    "clientId": "${client_uuid}",
    "refresh": "${refresh_token}"
}

$ curl -H 'Authorization: Bearer ${jwt_token}' localhost:8080/api/auth
{"message":"Welcome to the API!"}

$ curl -H 'Authorization: Bearer ${jwt_token}' -H 'Content-Type: application/json' \
  --data '{"clientId": "${client_id}", "token": "${refresh_token}"}' \
  localhost:8080/api/auth/refresh

{
    "access": "${new_jwt_token}"
    "clientId": "${client_uuid}",
    "refresh": "${new_refresh_token}"
}

```


##Tests
Tests are in /test and written in Mocha/Chai
To run tests, `npm test` in the terminal

###Running tests against a local database
The test suite makes actual requests to the API which queries a MySQL database. The connection settings are stored as environment variables.
Environment variables are loaded from a file, called .env, that you need to add to the root of the application.
See [Environment Configuration](#environment-configuration) in order to change the config, on your machine, to point to a local database 

Once your environment is configured run tests using the `npm test` command


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
