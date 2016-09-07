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

By default, the site is served at http://localhost:8000/webpack-dev-server/ this gives you compiliation/error messages in the browser window. To browse just the "bare" site, go to http://localhost:8000.

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
