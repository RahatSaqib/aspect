const Adapter = require('@wojtekmaj/enzyme-adapter-react-17')
const { configure } = require('enzyme')
require('babel-polyfill')

configure({ adapter: new Adapter() })
