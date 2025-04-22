# Code Guidelines for GitHub Copilot

This document provides coding standards and rules to guide GitHub Copilot's suggestions. These rules align with our ESLint and Prettier configurations.

## Formatting Rules

- **Arrow Functions**: Use `avoid` for `arrowParens`. Example:

  ```javascript
  const add = (a, b) => a + b
  ```

- **Semicolons**: We don't use semicolons.

  Bad:

  ```javascript
  const greeting = 'Hello, world'
  ```

  Good:

  ```javascript
  const greeting = 'Hello, world'
  ```

- **Single Quotes**: Always use single quotes for strings.

  Bad:

  ```javascript
  const name = 'John'
  ```

  Good:

  ```javascript
  const name = 'John'
  ```

- **Trailing Commas**: Use trailing commas where valid in ES5 (e.g., objects, arrays).

  Bad:

  ```javascript
  const numbers = [1, 2, 3]
  ```

  Good:

  ```javascript
  const numbers = [1, 2, 3]
  ```

- **Print Width**: Limit lines to a maximum of 120 characters.

  Bad:

  ```javascript
  const longString =
    'This is a very long string that exceeds the maximum print width of 120 characters and should be broken into multiple lines'
  ```

  Good:

  ```javascript
  const longString =
    'This is a very long string that exceeds the maximum print width of 120 characters ' +
    'and should be broken into multiple lines'
  ```

- **Tab Width**: Use 2 spaces for indentation.

  Bad:

  ```javascript
  function example() {
    console.error('Indented with 4 spaces')
  }
  ```

  Good:

  ```javascript
  function example() {
    console.error('Indented with 2 spaces')
  }
  ```

- **Padding Between Functions**: Always include a blank line between function declarations.

  Bad:

  ```javascript
  function firstFunction() {
    console.warn('First function')
  }
  function secondFunction() {
    console.warn('Second function')
  }
  ```

  Good:

  ```javascript
  function firstFunction() {
    console.warn('First function')
  }

  function secondFunction() {
    console.warn('Second function')
  }
  ```

- **Object Curly Newlines**: Use consistent formatting for object curly braces.

  Bad:

  ```javascript
  const obj = { a: 1, b: 2 }
  ```

  Good:

  ```javascript
  const obj = {
    a: 1,
    b: 2,
  }
  ```
