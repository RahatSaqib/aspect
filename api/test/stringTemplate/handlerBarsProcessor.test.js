const { assert } = require('chai')
const {
  processUsingHandlebarsSyntax,
} = require('../../src/stringTemplate/service')

describe('stringTemplate/service/processUsingHandleBarsSyntax', () => {
  it('should replace handlebars tokens in the string with properties in the object provided', () => {
    const templateString =
      'This a template that has a few handlebars tokens:\n' +
      'token 1: {{token1}},\n' +
      'token 2: {{token2}},' +
      'last token: {{[last token]}}'
    const dataObject = {
      token1: 'value for token 1',
      token2: 'value for token 2',
      'last token': 'the value for the last token',
    }
    const processedString = processUsingHandlebarsSyntax(
      templateString,
      dataObject
    )
    assert.equal(
      processedString,
      'This a template that has a few handlebars tokens:\n' +
        'token 1: value for token 1,\n' +
        'token 2: value for token 2,' +
        'last token: the value for the last token'
    )
  })

  it('should replace handlebars tokens in the string with nested properties in the object provided', () => {
    const templateString =
      'This a template that has a few handlebars tokens:\n' +
      'nested property value: {{nestedObject.propertyValue}},\n' +
      'token 1: {{anotherNestedObject.tokens.[0]}},\n' +
      'token 2: {{anotherNestedObject.tokens.[1]}},\n' +
      'last token: {{anotherNestedObject.tokens.[2].veryLastValue}}'
    const dataObject = {
      nestedObject: {
        propertyValue: 'nested property value',
      },
      anotherNestedObject: {
        tokens: [
          'token 0 value',
          'token 1 value',
          { veryLastValue: 'very last value' },
        ],
      },
    }
    const processedString = processUsingHandlebarsSyntax(
      templateString,
      dataObject
    )
    assert.equal(
      processedString,
      'This a template that has a few handlebars tokens:\n' +
        'nested property value: nested property value,\n' +
        'token 1: token 0 value,\n' +
        'token 2: token 1 value,\n' +
        'last token: very last value'
    )
  })
})
