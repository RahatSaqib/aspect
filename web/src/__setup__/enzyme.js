import Adapter from '@wojtekmaj/enzyme-adapter-react-17'
import { configure } from 'enzyme'
import enzymeSerializer from 'enzyme-to-json/serializer'
import { expect } from 'vitest'
import 'babel-polyfill'

configure({ adapter: new Adapter() })
expect.addSnapshotSerializer(enzymeSerializer)
