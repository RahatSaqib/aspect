# Aspect Web

This is the web client for the aspect API

It's based on the react-webpack yeoman generator: <https://github.com/newtriks/generator-react-webpack>

## Installation

Clone the repository, then:

```bash
# Install dependencies
yarn
```

## Available Commands

By default, the site is served at <http://localhost:8000/webpack-dev-server/> this gives you compilation/error messages in the browser window. To browse just the "bare" site, go to <http://localhost:8000>.

**Notice** when running `yarn start`, you'll immediately see `Cannot GET /` in the browser. Wait a little bit for the first compilation to be done, then refresh your browser.

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
yarn test:single (example: `yarn test: single src/MigratedComponents/AspectTable/TableHeader/Tests/TableHeaders.test.jsx`)

# Lint all files in src (also automatically done AFTER tests are run)
yarn lint

# Clean up the dist directory
yarn clean
```

## Component Scaffolding

There are some helpers to generate boilerplate for code we write often. Components, Stories for components, and tests for components.

```bash
# Start for development
yarn scaffold --name --item

--name: name of the component [string]
--item: which helper template to generate [string options: all, index, test, story]
```

As example:
`yarn scaffold AspectButton index,test` will generate the `AspectButton` index component, as well as a corresponding test for that component.

`yarn scaffold AspectButton all` will generate the index component, story and test for this component.

`yarn scaffold AspectButton test` will only generate the test for an existing component.

Make sure to run the command in the root of the folder you want to create the component, and if the folder already exists, then it will not overwrite what is there.

## NVM Management

- we have a `.nvmrc` file in the root that will allow us to initiate our developer environment to the correct node version on load.
- you will be able to add a small snippet to your bash of choice to change the NVM version automatically, or
- simply run `nvm use` (space after 'use' is intentional) and it will change to the version specified within `.nvmrc`

### Using ZSH

- <https://gist.github.com/pokorson/c2bd488842f4714c06d97b0b417e2619>

## i18n

### Merging with develop

As a general rule please remember:
**NOT MERGE .PO, .MO, translations.js files with develop on your PR**

To avoid inserting bad and duplicated keys we are not going to merge these files. It doesn't matter which one you are going to accept in a merge action (Keep local changes or develop branch changes), just pick only one and accept it completely. Once this action was made and committed just continue with the next step to generate the `.pot` file and sync all the language files.

### Extracting new translations

1. Edit your components in `src/**/*`
2. `yarn run updatemessages:start`
3. Create or update `.po` files. See below.
4. `yarn run updatemessages:end`
5. Commit stuff in `src/shared/i18n/**/*`

In step 3, you'll need to create or update `.po` files inside `src/shared/i18n` folder. The `.po` files store translations for each locale.

Creating a `.po` file means adding new locale support.

Updating `.po` files means updating existing translations with newly added messages due to changes in step 1.

### Create `.po` files

1. Open [Poedit](https://poedit.net)
2. Click `Create new translation`
3. Select `diff.pot` from the file dialog
4. Select language of the translation from the dropdown
5. When done, click `File > Save`. Set filename to `web.${LOCALE_NAME}.po` and store it under `src/shared/i18n` folder.

### Update `.po` files

1. Open [Poedit](https://poedit.net)
2. Click `Edit a translation`
3. Select `src/shared/i18n/web.${LOCALE_NAME}.po` from the file dialog
4. Click `Catalog > Update from POT file`
5. Select `src/shared/i18n/diff.pot` from the file dialog
6. Update translations for each items inside the window
7. When done, click `File > Save`

### Creating a CSV file based on a po file

This is useful for sharing a CSV with a translator so they can easily edit it.
To create a CSV of all Portuguese translations:

```bash
po2csv src/shared/i18n/web.pt-PT.po portuguese.csv
```

#### Using existing GxAlert translations when adding a new new language

A lot of the strings in GxAlert and Aspect are the same. The translations on GxAlert have already been reviewed by our clients and adjusted by us over the years, so it makes sense to use them as a foundation.

We'll use "csv2po" for converting the CSV from GxAlert to .po. It's part of the [translate toolkit](http://docs.translatehouse.org/projects/translate-toolkit/en/latest/index.html)

Complete the steps under "Create `.po` files" above. Then:

1. Install the translate toolkit: `pip3 install translate-toolkit`
2. Make sure that the CSV from GxAlert has three columns:
   a. Location (resource ID)
   b. Source Language (the English string)
   c. Target Language (the translated string)
3. Run csv2po: `csv2po -i gxalert_translations.csv -o web.LANGUAGECODE.po -t diff.pot`, where:
   -i: The CSV containing translations from GxAlert
   -o: The .po file you created in POEdit
   -t: The diff.pot that is generated when running `yarn run updatemessages:start`
4. The translations should now be part of the po file and you can now edit the .po file as usual in POEdit

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

## Storybook

```bash
# Run styleguide
yarn storybook
```

To view storybook, visit <http://localhost:8001/>.

## Styleguide [DEPRECATED]

TO BE REMOVED: Once Storybook has been adopted fully, this will be removed. See Issue: <https://github.com/SystemOneId/aspect/issues/1546>

To view styleguides, visit <http://localhost:6060/>.

```bash
# Run styleguide
yarn styleguide
```

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
