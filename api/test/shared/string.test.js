const { assert } = require('chai')
const { getAllStringsEnclosedBetweenCharacters, splitWithEscape } = require('../../src/shared/string')

describe('Shared String Utility Functions', () => {
  it('should be able to extract all strings within a string that are enclosed by single quotes', () => {
    const noQuotedStrings = getAllStringsEnclosedBetweenCharacters(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur'
    )
    assert.typeOf(noQuotedStrings, 'array')
    assert.equal(noQuotedStrings.length, 0)

    const oneQuotedString = getAllStringsEnclosedBetweenCharacters(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, 'sed do eiusmod tempor incididunt ut labore' et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur"
    )
    assert.equal(oneQuotedString.length, 1)
    assert.equal(oneQuotedString[0], 'sed do eiusmod tempor incididunt ut labore')

    const fiveQuotedString = getAllStringsEnclosedBetweenCharacters(
      "'Lorem ipsum dolor' sit amet, consectetur adipiscing elit, 'sed do eiusmod \"tempor\" incididunt ut labore' et dolore magna 'aliqua.\nUt enim ad minim' veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo 'consequat.\n\nDuis aute 'irure dolor in \\'reprehenderit\\' in voluptate velit esse cillum dolore eu fugiat nulla pariatur"
    )
    assert.deepEqual(fiveQuotedString, [
      'Lorem ipsum dolor',
      'sed do eiusmod "tempor" incididunt ut labore',
      'aliqua.\nUt enim ad minim',
      'consequat.\n\nDuis aute ',
      'reprehenderit\\',
    ])
  })

  it('should be able to extract all strings within a string that are enclosed by caller specified quotes', () => {
    const noQuotedStrings = getAllStringsEnclosedBetweenCharacters(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
      '"'
    )
    assert.typeOf(noQuotedStrings, 'array')
    assert.equal(noQuotedStrings.length, 0)

    const oneQuotedString = getAllStringsEnclosedBetweenCharacters(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, "sed do eiusmod tempor incididunt ut labore" et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
      '"'
    )
    assert.equal(oneQuotedString.length, 1)
    assert.equal(oneQuotedString[0], 'sed do eiusmod tempor incididunt ut labore')

    const fiveQuotedString = getAllStringsEnclosedBetweenCharacters(
      `"Lorem ipsum dolor" sit amet, consectetur adipiscing elit, "sed do eiusmod 'tempor' incididunt ut labore" et dolore magna "aliqua.\nUt enim ad minim" veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo "consequat.\n\nDuis aute "irure dolor in \\"reprehenderit\\" in voluptate velit esse cillum dolore eu fugiat nulla pariatur`,
      '"'
    )
    assert.deepEqual(fiveQuotedString, [
      'Lorem ipsum dolor',
      "sed do eiusmod 'tempor' incididunt ut labore",
      'aliqua.\nUt enim ad minim',
      'consequat.\n\nDuis aute ',
      'reprehenderit\\',
    ])
  })

  it('should be able to split using a string while taking an escape character int account', () => {
    const splitString = splitWithEscape('|||hello|my|pipe|delimited|name|is|Bryan&|Richards', '|', '&')
    assert.deepEqual(splitString, ['', '', '', 'hello', 'my', 'pipe', 'delimited', 'name', 'is', 'Bryan|Richards'])
  })
})
