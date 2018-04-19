# Aspect API

This is the web api for all aspect clients.

Swagger UI is available for testing the UI manually and viewing route documentation at http://localhost:8080/documentation .  Use the `api/auth` route to generate a JWT token (named 'access' in response) and include the token in authenticated routes.

## Quick start

Quick Start for development. Everything is explained in more detail throughout this README.


### New Development Setup

```bash
# Install Node.js and Yarn
# Install MySQL
# Install RabbitMQ
#  WINDOWS USERS READ THIS: https://www.rabbitmq.com/install-windows-manual.html

# Enable RabbitMQ plugins
rabbitmq-plugins enable rabbitmq_management
# Management console at http://localhost:15672 guest:guest by default

# Clone the repository
git clone git@github.com:SystemOneId/aspect
cd aspect/api

# Install dependencies
yarn install

# Create database and database user (changing password as desired)
mysql -u root <<EOT
create database aspect;
create user 'aspectapi'@'localhost' identified by 'mypassword';
grant all on aspect. * to 'aspectapi'@'localhost';
flush privileges;
EOT

# Create an .env file and configure settings for your environment
# using .env.example as a template
# Make sure to uncomment following line so that knex could find it's seed directory
# seeds.directory='./seeds/development'
cp .env.example .env
vim .env

# Run migrations
yarn run knex migrate:latest

# Populate database with seed files (optional)
yarn run knex seed:run

# Start the server
yarn start
```

### Update development environment

To update, pull from `develop` and run any new migrations.

```bash
git checkout develop
git pull origin develop

# If new migrations (but safe to run any time)
npm run knex migrate:latest
```

If you would like to start with a fresh database:

```bash
# Drop and recreate database (or rollback migrations)
mysql -u root <<EOT
drop database aspect;
create database aspect;
EOT

# Run migrations and seed files
yarn run knex migrate:latest
yarn run knex seed:run
```


##Installation
Clone the repository, then:

```bash
# Install dependencies
yarn install
```

###Environment Configuration
Then add a .env file to the root of the application (inline with server.js) and add your environment config to it.  See `.env.example` for reference.

```
secret=Any_Random_String

passwordAttempts=5

db.connectionLimit=100
db.host=localhost
db.user=aspectapi
db.password=your_local_database_password
db.databaseName=aspect
db.debug=false

sendgrid.apiKey=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
email.fromAddress=support@gxalert.com

aspectUrl=http://dev.aspect.id
amqp.url=amqp://localhost
```

Logs requests to console by default, to forward to Logstash, set the endpoint.

```
logstash.endpoint=udp://localhost:9001

```

Optionally, configure the Raven DSN to ship errors to Sentry:

```
raven.dsn=https://...
```


### Running Server

It's best to install nodemon globally and use that to run the project so that the server restarts automatically on any change:

```bash
nodemon src/server
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

## Migrations

Migrations are managed with [knex](http://knexjs.org/#Migrations).

To update to latest migration, run `npm run knex migrate:latest`.  Migrations are tracked in the `knex_migrations` table so only migrations that have not been applied will be run in the appropriate order.  It is safe to run migrations at any time. If no migrations need to run, the command will only print a message indicating that you are up to date.

```bash
# Create a new migration
$ npm run knex migrate:make migration_name
Created migration: ./migrations/{dateTime}_migration_name.js

# Edit created file in migrations using Schema API or Raw Queries

# Update to latest migrate
$ npm run knex migrate:latest

# Rollback if migration done in error
$ npm run knex migrate:rollback

```

### Troubleshooting

Note that MySQL does not allow transactional DDL (schema updates).  If you make an error during development of your new migration, you may have to manually run DDL updates that were aborted due to an error. You may also have to manually delete the entry in the `knex_migrations` table for the migration to get to a consistent state.  This is a limitation in MySQL, not knex.

As an example, assume that you need to manually clean up a migration named '20160913144739_permissions.js' (and it is the latest migration):

```sql
select * from knex_migrations where name='20160913144739_permissions.js';

+----+-------------------------------+-------+---------------------+
| id | name                          | batch | migration_time      |
+----+-------------------------------+-------+---------------------+
| 16 | 20160913144739_permissions.js |     1 | 2016-09-13 16:40:25 |
+----+-------------------------------+-------+---------------------+

delete from knex_migrations where name='20160913144739_permissions.js';
```

## Seed Files

Seed files populate your database with test or development seed data.  They are not configured by default.  If you would like to use them, edit your `.env` file and set your seeds directory containing the scripts that populate your database.

```
# in .env
seeds.directory='./seeds/development'
```
Now you can run all seed files within that directory (alphabetical order).

```bash
npm run knex seed:run
```

Unlike migrations ALL seed files are run every time.  You should structure your seed files to take this into account.  The files are run in alphabetical order, so it is good practice to prefix your seed name with the order to run. If a seed file should only be executed once, check for existing data and return early before inserting new seed data.

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
