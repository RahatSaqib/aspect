# Aspect Web

This is the web client for the aspect API

It is a React single page app bundled with [Vite](https://vite.dev/). Node 14.18 or newer is required (see `.nvmrc`).

## Installation

Clone the repository, then:

```bash
# Install dependencies
yarn
```

## Available Commands

By default, the site is served at <http://localhost:8000>. The dev server starts in under a second and applies changes through hot module replacement, so there is no initial compilation to wait for.

```bash
# Start for development
yarn start

# Build the dist version and copy static files
yarn dist

# Run unit tests
yarn test

# Run unit tests with watch, and no coverage
yarn test:no-coverage

# Run a single unit test by appending file to test
yarn test:single (example: `yarn test: single src/components/AspectTable/TableHeader/Tests/TableHeaders.test.jsx`)

# Lint all files in src (also automatically done AFTER tests are run)
yarn lint

# Clean up the dist directory
yarn clean
```

## I18N

For information on this, please refer to the [Aspect Web - Messages Translations](./src/messages/README.md) on the specified folder.

## NVM Management

- we have a `.nvmrc` file in the root that will allow us to initiate our developer environment to the correct node version on load.
- you will be able to add a small snippet to your bash of choice to change the NVM version automatically, or
- simply run `nvm use` (space after 'use' is intentional) and it will change to the version specified within `.nvmrc`

### Using ZSH

- <https://gist.github.com/pokorson/c2bd488842f4714c06d97b0b417e2619>

## Deploying

We're serving the web files from an S3 bucket through cloudfront.
Here's the command for uploading a directory to an S3 bucket using the S3 CLI:

```bash
aws s3 cp dist s3://aspect-web-dev --recursive
```

## Updating Dependencies

To check which dependencies have newer versions available:

```bash
yarn outdated
```

To update all to the latest version (this is not the same as the "Wanted" version):

```bash
yarn update
```

Also update vendorPackages in dist.js to make sure that vendor packages are bundled separately from our code

## Updating snapshots

When you have failed tests which use `expect(element).toMatchSnapshot()` and you know something has changed in the
code but test should pass, then probably you have to update snapshot.

Run command `yarn run test:snapshot` which regenerates snapshot artifacts in `__snapshots__` folders

Another possible way to update snapshots is running `jest --updateSnapshot` (make sure `jest` is globally installed)

## Sentry

Sentry is an engine to track and analyze the performance of the website but mostly for handling and registering the unhandling bugs.
For configuring it we inserted in the top level component and its entry page the next initialization:

<https://github.com/SystemOneId/aspect/blob/15b05296956b3994e220488079506fb154595156/web/src/index.jsx#L15>

```javascript
Sentry.init({
  dsn: config.sentry.dsn,
  integrations: [
    new Integrations.BrowserTracing({
      tracingOrigins: config.sentry.tracingOrigins || [
        'localhost:8000',
        '*.aspect.id',
      ],
    }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
})
```

The integration for browser tracing is the one responsable for tracking the performance of the application.

And in the config folder define as part of the config

```javascript

const config = {
  ...
  sentry: {
    dsn: 'https://6fdaf6e504b6479782895c8703580006@o944950.ingest.sentry.io/5893495',
    tracingOrigins: ['localhost:8000', '*.aspect.id'],
  },
  ...
}

```

## Creating a custom error | Frontend (please read the backend part also)

To create a custom error, we need to pass "customErrorNotifications" to our "errorNotifications" object in the aspectFetch.
customErrorNotifications is an object that shoukd have as a key our custom statusCode. As the value we need to call
badRequestBuilder. badRequestBuilder expectes at least an object with messages defined as i18n. And if needed a
severity type. By default its 'error'
eg:

```javascript
import {
  badRequestBuilder
} from '../error/CommonErrorNotifications'
...

const messages = defineMessages({
  accountLockedTitle: {
    id: 'pages.Login.accountLocked.title',
    defaultMessage: 'This is the title to display',
  },
  accountLocked: {
    id: 'pages.Login.accountLocked.resolutions',
    defaultMessage: 'This is the resolution (body)',
  },
})

...

aspectFetch('...', {
  method: 'POST',
  body: ...,
  errorNotifications: {
    401: {...},
    409: {...},
    403: {...},
    customErrorNotifications: {
      444: badRequestBuilder(messages, 'warn'),
    }
  },
})

```
