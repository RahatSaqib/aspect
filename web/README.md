# Aspect Web
This is the web client for the aspect API

It's based on the react-webpack yeoman generator: https://github.com/newtriks/generator-react-webpack



## Installation
Clone the repository, then:

```bash
# Install dependencies
npm install
```


## Available Commands

By default, the site is served at http://localhost:8000/webpack-dev-server/ this gives you compilation/error messages in the browser window. To browse just the "bare" site, go to http://localhost:8000.

```bash
# Start for development
npm start # or
npm run serve


# Build the dist version and copy static files
npm run dist
```

To make sure everything works, you can spin up a quick web server with this command:
```bash
python -m SimpleHTTPServer 8000
```

# Run unit tests
npm test

# Lint all files in src (also automatically done AFTER tests are run)
npm run lint

# Clean up the dist directory
npm run clean

# Just copy the static assets
npm run copy
```

## i18n

1. Edit your components in `src/**/*`
2. `npm run updatemessages:start`
3. Create or update `.po` files. See below.
4. `npm run updatemessages:end`
5. Commit stuff in `src/i18n/**/*`

In step 3, you'll need to create or update `.po` files inside `src/i18n` folder. The `.po` files store translations for each locale. Creating a `.po` file mean adding new locale support. Updating `.po` files means updating existing translations with newly added messages due to changes in step 1.

### Create `.po` files

1. Open [Poedit](https://poedit.net)
2. Click `Creare new translation`
3. Select `src/i18n/diff.pot` from the file dialog
4. Select language of the translation from the dropdown
5. Add translations for each item inside the window
5. When done, click `File > Save`. Set filename to `web.${LOCALE_NAME}.po` and store it under `src/i18n` folder.

### Update `.po` files

1. Open [Poedit](https://poedit.net)
2. Click `Edit a translation`
3. Select `src/i18n/web.en_US.po` from the file dialog
4. Click `Cataglog > Update from POT file`
5. Select `src/i18n/diff.pot` from the file dialog
6. Update translations for each items inside the window
7. When done, click `File > Save`


## Deploying
We're serving the web files from an S3 bucket through cloudfront.
Here's the command for uploading a directory to an S3 bucket using the S3 CLI:

read```bash
aws s3 cp dist s3://aspect-web-dev --recursive
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

Also update vendorPackages in dist.js to make sure that vendor packages are bundled separately from our code
