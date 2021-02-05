# Aspect Web

This is the web client for the aspect API

It's based on the react-webpack yeoman generator: https://github.com/newtriks/generator-react-webpack

## Installation

Clone the repository, then:

```bash
# Install dependencies
yarn
```

## Available Commands

By default, the site is served at http://localhost:8000/webpack-dev-server/ this gives you compilation/error messages in the browser window. To browse just the "bare" site, go to http://localhost:8000.

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

## i18n

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
3. Select `src/shared/i18n/diff.pot` from the file dialog
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

To view storybook, visit http://localhost:8080/.

## Styleguide [DEPRECATED]

TO BE REMOVED: Once Storybook has been adopted fully, this will be removed. See Issue: https://github.com/SystemOneId/aspect/issues/1546

To view styleguides, visit http://localhost:6060/.

```bash
# Run styleguide
yarn styleguide
```

## Updating snapshots

When you have failed tests which use  ```expect(element).toMatchSnapshot()``` and you know something has changed in the
code but test should pass, then probably you have to update snapshot.

Run command ```yarn run test:snapshot``` which regenerates snapshot artifacts in ```__snapshots__``` folders

Another possible way to update snapshots is running ```jest --updateSnapshot``` (make sure ```jest``` is globally installed)

## Tables Placeholder
