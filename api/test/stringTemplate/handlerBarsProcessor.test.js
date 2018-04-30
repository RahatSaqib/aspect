const { assert } = require('chai')
const {
  processUsingHandlebarsSyntax,
  getMustacheTokensInString,
} = require('../../src/stringTemplate/service')

describe('stringTemplate/service/', () => {
  describe('processUsingHandleBarsSyntax', () => {
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

    it('should ignore redundant white space padding in placeholders', () => {
      const templateString =
        'This a template that has a few handlebars tokens:\n' +
        'token 1: {{  token1\t}},\n' +
        'token 2: {{ token2\r\n}},' +
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

  describe('getMustacheTokensInString', () => {
    it('should return all mustache style placeholders in the template string', () => {
      const templateString =
        'This a template that has a few handlebars tokens:\n' +
        'plain token: {{tokenValue}},\n' +
        'plain token with redundant white space: {{  paddedTokenValue\t}},\n' +
        'token with line breaks: {{\nlineBreaksInTokenValue\r\n}},\n' +
        'nested property value: {{nestedObject.propertyValue}},\n' +
        'token 1: {{anotherNestedObject.tokens.[0]}},\n' +
        'token 2: {{anotherNestedObject.tokens.[1]}},\n' +
        'another instance of token 1: {{anotherNestedObject.tokens.[0]}},\n' +
        'another instance of token 2: {{anotherNestedObject.tokens.[1]}},\n' +
        'a token with white space: {{[this has white\tspace]}},\n' +
        'last token: {{anotherNestedObject.tokens.[2].veryLastValue}}'
      const mustacheTokens = getMustacheTokensInString(templateString)
      assert.deepEqual(mustacheTokens, [
        '{{tokenValue}}',
        '{{  paddedTokenValue\t}}',
        '{{\nlineBreaksInTokenValue\r\n}}',
        '{{nestedObject.propertyValue}}',
        '{{anotherNestedObject.tokens.[0]}}',
        '{{anotherNestedObject.tokens.[1]}}',
        '{{anotherNestedObject.tokens.[0]}}',
        '{{anotherNestedObject.tokens.[1]}}',
        '{{[this has white\tspace]}}',
        '{{anotherNestedObject.tokens.[2].veryLastValue}}',
      ])
    })
  })
})
