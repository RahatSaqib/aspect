# Aspect API

This is the web api for all aspect clients.

Swagger UI is available for testing the UI manually and viewing route documentation at <http://localhost:8080/documentation> . Use the `api/auth` route to generate a JWT token (named 'access' in response) and include the token in authenticated routes.

## Recommended versions

Node v14 ([nvm](https://github.com/creationix/nvm) highly recommended)

MySql v8.0

Yarn v1.22.x

## Quick start

Quick Start for development. Everything is explained in more detail throughout this README.

### New Development Setup

#### Follow this guide to set up MySQL and other necessary tools:

- <https://systemone.youtrack.cloud/articles/ASP-A-27164676/Developer-Setup>

**Note**: If you are using the Docker setup described in the guide, you do not need to install MySQL, RabbitMQ, or any other third-party software on your local machine.

#### RabbitMQ Installation

- MAC OS: Follow steps from <https://www.rabbitmq.com/install-homebrew.html>
- Windows: Follow steps from <https://www.rabbitmq.com/install-windows-manual.html>
- Ubuntu: Follow steps from <https://www.rabbitmq.com/install-debian.html>

#### Once completed, clone the repo as follow:

##### Follow these steps for a one-time setup:

```bash
git clone git@github.com:SystemOneId/aspect
cd aspect/api

# Install dependencies
yarn install

# Create an .env file and configure settings for your environment
# using .env.example as a template
# Make sure to uncomment following line so that knex could find it's seed directory
# seeds.directory='./seeds/development'
cp .env.example .env
vim .env
```

##### Populate the following fields in the .env file:

```bash
secret = <some_secret_random_string>

admin.email = 'your_email@systemone.co'
admin.cell = '+5491151545676'

swagger.enabled = false

twilioAccountSid = "AC8b585894f40b206d25c75f944af1e664"
twilioAuthToken = "64eaea18bc6487944c169781da7bcc61"
twilioFromNumber = "+14423337971"
twilioMessagingServiceSid = "MG3ce426d5d330c9720bff0237690cba14"

webhook.redcap.url= 'asdf'
webhook.redcap.authToken= 'jkasd'
```

##### Create and configure the database:

```bash
yarn run db:recreate

# Run migrations
yarn run knex migrate:latest

# Populate database with seed files (optional)
yarn run knex seed:run
```

### Starting the Server

##### To run the application, use the following command:

```bash
# Start the server
yarn start
```

### Windows Development Setup (native, no Docker)

Run **all** `yarn`/`npm`/`node` commands from **Windows PowerShell or cmd.exe** (not WSL). Installing dependencies in WSL can produce Linux native binaries (`bcrypt`) and POSIX `node_modules/.bin` links
that Windows `node.exe` can't load (`is not a valid Win32 application` / `'nodemon' is not recognized`).

Commands below assume the MySQL `bin` is on your `PATH`; otherwise use the full path to
`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`.

**1. Node 14** (via [nvm-windows](https://github.com/coreybutler/nvm-windows); use the version in `api/.nvmrc`)

    nvm install 14.17.0
    nvm use 14.17.0
    npm install -g yarn          # yarn is per-Node-version in nvm-windows

If `nvm install` fails during npm-zip extraction (known nvm-windows bug): download
`node-v14.17.0-win-x64.zip` from <https://nodejs.org/dist/v14.17.0/>, extract into
`C:\Users\<you>\AppData\Local\nvm\v14.17.0`, then `nvm use 14.17.0`.

**2. Install dependencies**

```powershell
yarn install
```


**3. MySQL — auth plugin** (the old `mysql` driver can't do MySQL 8's default `caching_sha2_password`)

```powershell
mysql -u root -p -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '<your_password>';"
```

**4. MySQL — sql_mode** (without this: `ER_WRONG_FIELD_WITH_GROUP` / `only_full_group_by` errors).
Edit `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini` **as Administrator**; under `[mysqld]` set:

```ini
sql-mode="NO_ENGINE_SUBSTITUTION"
```

then restart the service:

```powershell
Restart-Service MySQL80
```

**5. MySQL — load time-zone tables** (one time). The app uses `CONVERT_TZ(..,'Asia/Dhaka')`, which
returns `NULL` when these tables are empty (→ NULL `startedOn`, broken reports). Windows ships no
zoneinfo, so import MySQL's prebuilt package: download the **`*_posix_sql`** archive from
<https://dev.mysql.com/downloads/timezones.html>, extract it, then:

```powershell
cmd /c "mysql -u root -p mysql < timezone_posix.sql"
```

Verify (must not print `NULL`):

```powershell
mysql -u root -p -N -e "SELECT CONVERT_TZ('2026-01-01 00:00:00','+00:00','Asia/Dhaka');"
```

**6. RabbitMQ** (`amqp://localhost:5672`). Native: <https://www.rabbitmq.com/install-windows-manual.html>. Or, if you have Docker:

```powershell
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

**7. `.env`** — set `swagger.enabled = false` (`hapi-swagger` has an unmet `joi@17` peer dependency and crashes on boot when enabled).

**8. Create + migrate + seed the database**

```powershell
yarn run db:reseed
```

**9. Start the server** (the default `start` uses a Unix `TZ=UTC` prefix that cmd.exe can't parse)

```powershell
yarn start:win
```

> **Time-zone note:** Node on Windows **ignores the `TZ` env var**, so `start:win` runs in your
> Windows system time zone, not UTC (DB-side `CONVERT_TZ` is unaffected). To match the UTC
> production servers, set the Windows system time zone to **"(UTC) Coordinated Universal Time"**.

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

### Tuning MySql

To let MySql execute complex queries which bring large amount of records it should be tuned by increasing buffer pool size. Open `mysql.ini` file (or `/etc/mysql/mysql.conf.d/mysqld.cnf`) and in `[mysqld]` section add this 3 lines:

```env
innodb_buffer_pool_chunk_size = 1073741824
innodb_buffer_pool_instances = 4
innodb_buffer_pool_size = 4294967296
```

See details about this params:

`innodb_buffer_pool_size` - https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_buffer_pool_size

`innodb_buffer_pool_instances` - https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_buffer_pool_instances

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

Tests are located in the `/test` folder and are written using Mocha and Chai.

Unit test files should have a `.test.js` suffix.
Contract test files should have a `.spec.js` suffix.

### Running Unit Tests

To run unit tests from the root folder, use the following command:

```bash
yarn api:unit
```

To run unit tests from the `/api` folder, use this command:

```bash
yarn mocha:unit
```

These tests can run without the local development instance running in parallel.

### Running Contract Tests Locally

To run contract tests from the root folder, use this command:

```bash
yarn api:contract
```

To run contract tests from the `/api` folder, use this command:

```bash
yarn mocha:contract
```

To run single contract test from the `/api` folder, use this command:

```bash
yarn mocha:contract -g "your test description or title should come here"
```

The contract test suite makes actual requests to the API, utilizing all our real services like the database, message queue, and background jobs. Ensure the local server is running when executing contract tests.

The connection settings are stored as environment variables. These variables are loaded from a file named `.env`, which you need to add to the root of the application. Refer to the [Environment Configuration](#environment-configuration) section to modify the configuration on your machine to point to a local database.

The `seeds/test` directory is utilized to seed the necessary data for executing contract tests.

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
# in .env, for development
seeds.directory='./seeds/development'
```

```env
# in .env, for test
seeds.directory='./seeds/test'
```

Now you can run all seed files within that directory (alphabetical order).

```bash
yarn run knex seed:run
```

Unlike migrations ALL seed files are run every time. You should structure your seed files to take this into account. The files are run in alphabetical order, so it is good practice to prefix your seed name with the order to run. If a seed file should only be executed once, check for existing data and return early before inserting new seed data.

## Stress test with siege

Install siege: <http://jason.pureconcepts.net/2011/09/installing-siege-mac-os-x-lion/>

To test the auth endpoint, run this command:
siege --concurrent=25 --content-type="application/json" '<http://localhost:8080/api/auth> POST { "name": "admin", "password": "test07", "clientName": "SIEGE", "clientId": "1234" }'

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

## Creating a custom error | Backend (please read the frontend part also)

To create a custom error, we need to create a new Bomm.ERROR. Then assign our custom error data, such as the errorKeyCode, that will be used by the frontend as an 18n key. We also have to assign a new statusCode. Lastly, reformat the error and return it.
eg:

```javascript
const err = Boom.forbidden('Your account is locked.', {
  errorKeyCode: 'accountLocked',
})
err.output.payload.extraData = err.data
err.output.statusCode = 444
err.reformat()
return err
```

## API Versioning

API versioning supports multiple versions of api end points. This mechanism enables api versioning based on custom header api-version. We can support/target individual endpoint by implementing this mechanism.

API versioning plugin is stored in /src/plugin/apiVersioning.js

- Check if an accept header OR a custom header (default api-version) is present and extract the version
- If no version was extracted (e.g. no headers sent) use the default version
- Check if a versioned route (like /v2/users) exists -> if so rewrite the url from /users to /v2/users, otherwise do nothing

API versioning have three options

- defaultVersion (required) : If any versioned endpoint is requested without api-version custom header, then it will take defaultVersion.
- versionHeader (optional) : Configure this param if want to access different custom header instead of api-version
- mobileApiPath (optional) : In case we have a base path different from / (example: /api/). Per default this is /.

Following are the use-cases for the api versioning

- If there is an endpoint with a matching version to the request, use that endpoint
- If there are any versioned endpoints with a version, lower than the version specified in the request, use the highest version that is below the version specified in the request
- If there are any un-versioned endpoints use this un-versioned endpoint

### Testing with Postman

To test API, go to Aspect API postman collection.
Select Environment - Aspect Local Development
Go to Auth folder under Aspect API collection
Select auth api and hit send button
It will return success response with the Token
