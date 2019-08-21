const _ = require('lodash')

// A simple ASTM parser. astmPosition is a string in the format "H,5,1,1"
function getAstmField(astmMessage, astmPosition) {
  if (!astmMessage || !astmPosition) {
    return null
  }

  const astmArray = astmPosition.split(',').map(p => p.trim())

  if (astmArray.length !== 4) {
    return null
  }

  // first, get correct record/line
  const line = _.find(
    astmMessage.split(/\r|\n/),
    l =>
      l.indexOf(
        `${astmArray[0]}|${astmArray[0] === 'H' ? '' : astmArray[2]}`
      ) === 0
  )

  if (!line) {
    return null
  }

  // now, get correct part of the line
  const parts = line.split('|')
  return parts[astmArray[1] - 1].split('^')[astmArray[3] - 1]
}

module.exports = {
  getAstmField,
}
