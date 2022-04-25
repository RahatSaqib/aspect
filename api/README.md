# Aspect API

This is the web api for all aspect clients.

Swagger UI is available for testing the UI manually and viewing route documentation at <http://localhost:8080/documentation> . Use the `api/auth` route to generate a JWT token (named 'access' in response) and include the token in authenticated routes.

## Recommended versions

Node v8.13 ([nvm](https://github.com/creationix/nvm) highly recommended)

MySql v8.0

Yarn v1.9.4

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
set global log_bin_trust_function_creators=1;
flush privileges;
EOT

# If you have ONLY_FULL_GROUP_BY in your sql_mode by default, add this to my.cnf or my.ini in the [mysqld] section
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION

# Configure MySQL to use UTC. Add the following to my.cnf or my.ini in the [mysqld] section
default-time-zone=+00:00

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
yarn run knex migrate:latest
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

## Installation

Clone the repository, then:

```bash
# Install dependencies
yarn install
```

### Environment Configuration

Then add a .env file to the root of the application (inline with server.js) and add your environment config to it. See `.env.example` for reference.

```env
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

Optionally, configure the Raven DSN to ship errors to Sentry:

```env
# Optional Sentry configuration
sentry.dsn='https://sentrydsn ....'

```

### NVM Management

- we have a `.nvmrc` file in the root that will allow us to initiate our developer environment to the correct node version on load.
- you will be able to add a small snippet to your bash of choice to change the NVM version automatically, or
- simply run `nvm use` (space after 'use' is intentional) and it will change to the version specified within `.nvmrc`

#### Using ZSH?

- <https://gist.github.com/pokorson/c2bd488842f4714c06d97b0b417e2619>

### Running Server

It's best to install nodemon globally and use that to run the project so that the server restarts automatically on any change:

```bash
nodemon src/server
```

## Routes

`GET '/'`: Will return hello! (for testing)

`POST '/api/auth'`: Send name, password, clientId, and clientName in x-www-form-urlencoded format and if credentials are OK returns a JWT.

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

## Tests

Tests are in /test and written in Mocha/Chai
To run tests, `yarn test` in the terminal

### Running tests against a local database

The test suite makes actual requests to the API which queries a MySQL database. The connection settings are stored as environment variables.
Environment variables are loaded from a file, called .env, that you need to add to the root of the application.
See [Environment Configuration](#environment-configuration) in order to change the config, on your machine, to point to a local database

Once your environment is configured run tests using the `yarn test` command

## Migrations

Migrations are managed with [knex](http://knexjs.org/#Migrations).

To update to latest migration, run `yarn run knex migrate:latest`. Migrations are tracked in the `knex_migrations` table so only migrations that have not been applied will be run in the appropriate order. It is safe to run migrations at any time. If no migrations need to run, the command will only print a message indicating that you are up to date.

```bash
# Create a new migration
$ yarn run knex migrate:make migration_name
Created migration: ./migrations/{dateTime}_migration_name.js

# Edit created file in migrations using Schema API or Raw Queries

# Update to latest migrate
$ yarn run knex migrate:latest

# Rollback if migration done in error
$ yarn run knex migrate:rollback

```

### Troubleshooting

Note that MySQL does not allow transactional DDL (schema updates). If you make an error during development of your new migration, you may have to manually run DDL updates that were aborted due to an error. You may also have to manually delete the entry in the `knex_migrations` table for the migration to get to a consistent state. This is a limitation in MySQL, not knex.

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

Seed files populate your database with test or development seed data. They are not configured by default. If you would like to use them, edit your `.env` file and set your seeds directory containing the scripts that populate your database.

```env
# in .env
seeds.directory='./seeds/development'
```

Now you can run all seed files within that directory (alphabetical order).

```bash
yarn run knex seed:run
```

Unlike migrations ALL seed files are run every time. You should structure your seed files to take this into account. The files are run in alphabetical order, so it is good practice to prefix your seed name with the order to run. If a seed file should only be executed once, check for existing data and return early before inserting new seed data.

## Stress test with siege

Install siege: <http://jason.pureconcepts.net/2011/09/installing-siege-mac-os-x-lion/>

To test the auth endpoint, run this command:
siege --concurrent=25 --content-type="application/json" '<http://localhost:8080/api/auth> POST { "name": "sbaumgartner", "password": "test07", "clientName": "SIEGE", "clientId": "1234" }'

### Creating seeds for migrating from GxAlert to Aspect

We have a function called `baseGxAlertMigration` that sets up all the different bits and pieces we need for migrating a country from GxAlert to Aspect.

It mostly operates on JSON files in the country's fixtures-folder. The files contain data exported from GxAlert using the "migrage_from_gxalert.sql" file in /api/seeds/scripts:

- contactsFromGxAlert.json - Contains all Contacts that were set up in GxAlert. It also contains their level of access and what geographies they have access to. It does NOT include passwords. Aspect will migrate the password from GxAlert automatically when the user first signs in.
- customFieldsFromGxAlert.json - The custom fields for GxConnect that are configured in GxAlert. This is currently only used for setting up the resultDataSchema for the GeneXpert assays.
- geography.json - The states and LGAs in the country
- jobFunctions.json - The job functions (=roles) to set up for the country
- labClinic.json - This is ONLY for setting devices that use an Aspect API key such as the MGIT or m2000. It does not contain GeneXpert devices
- sitesFromGxAlert.json - This is the file that contains the GeneXpert devices in GxAlert and the sites that they are located at.

This should be deployed to the Aspect server for the country before data forwarding is set up in GxAlert.

### Testing Issues

You can manually trigger issues using the endpoint /issue/trigger.
See the `triggerIssue` function in issue/service.js for which issue types are supported.
You can also see here what data an issue type expects.
You can use curl or Postman to issue a POST to this endpoint and trigger an issue and any associated notifications.
For example, to trigger a "Device No Results" issue post to <http://localhost:8080/api/issue/trigger> with this body:

```json
{
  "issueType": "DeviceNoResults",
  "data": {
    "deviceId": 18,
    "lastResultOn": "2020-07-01"
  }
}
```

This will only work if there is an IssueType with the externalId "DeviceNoResults".
It will also only trigger an issue if IssueEventTrigger contains an entry for that issue type and the partner you're logged in as.
If you would like to test notifications, make sure you have them set up in the "NotificationType" table (and associated Message tables).

For further information please refer the Issue Readme ## For Issues and notification system check the next link [Issues](ISSUES.md#Issues)

## Deploying

We're serving the API through AWS beanstalk. Install the eb cli tools and commit changes, then:

```bash
eb deploy aspect-api-dev
eb open
```

## Updating Dependencies

To check which dependencies have newer versions available:

```bash
yarn outdated
```

To update all to the latest version (this is not the same as the "Wanted" version):

```bash
yarn upgrade
```

## For Issues and notification system check the next link

[Issues and notification system](ISSUES.md#A-simple-description-of-the-system)

## RabbitMQ Troubleshooting

As mentioned above under "New Development Setup", you can find the RabbitMQ UI at: http://localhost:15672 and login as guest:guest

Sometimes, it can be useful for troubleshooting to publish a message to a queue. To do that, log in to the management UI, click on Queues, select the queue that you wish to publish a message, then expand "Publish Message". The payload has to be in JSON format. For example, to publish a message about an SMS being ready for sending, the payload would be:

```json
{
  "type": "SMS_MESSAGE_READY_FOR_SENDING",
  "smsMessageId": 3
}
```

### Use RabbitMQ management UI on a server

You can use ssh port forwarding to view the RabbitMQ management UI on another server. For example, to browse the management UI of the DRC server:

```bash
ssh drc -L 15673:localhost:15672
```

You'll be able to browse the UI in your browser at http://localhost:15673
