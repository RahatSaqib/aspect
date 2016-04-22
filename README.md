# aspect-api

This is the web api for all aspect clients. 
It's using express as the middleware and JWT (jwt.io) for authentication.

##Installation
Clone the repository, then:

```bash
# Install dependencies
npm install
```

Then, set up secret and db connection string in config.js

The project is using some ES6 features, so for now, you'll have to start it with the --use_strict flag:

```bash
node --use_strict server.js
```

Alternatively, use nodemon, so you don't have to restart the server after every change:

```bash
nodemon --use_strict server.js
```



##Routes

```GET '/'```: Will return hello! (for testing)

```POST '/api/auth'```: Send name and password in x-www-form-urlencoded format and if credentials are OK returns a JWT.

```PUT '/api/auth'```: Post a JWT in the "x-access-token" header, and this endpoint will return a refreshed JWT.

```GET '/api/auth'```: When valid JWT is in header, returns a welcome-message (for testing that auth works)
