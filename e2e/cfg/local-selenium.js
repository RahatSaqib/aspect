const BINPATH = './node_modules/selenium-local/'

require('fs').stat(`${BINPATH}'selenium.jar`, (err, stat) => {
  if (err || !stat || stat.size < 1) {
    // ensure that the selenium.jar and chromedriver files are in the path provided.
    // If they are not, the latest versions of both are downloaded into that path.
    require('selenium-download').ensure(BINPATH, error => {
      //eslint-disable-line
      if (error) throw new Error(error)
      console.log('✔ Selenium & Chromedriver downloaded to:', BINPATH) // eslint-disable-line
    })
  }
})
