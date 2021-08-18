const { configure } = require('enzyme')
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17')
require('babel-polyfill')

configure({ adapter: new Adapter() })
