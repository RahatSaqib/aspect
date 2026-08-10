import Adapter from '@wojtekmaj/enzyme-adapter-react-17'
import { configure } from 'enzyme'
import enzymeSerializer from 'enzyme-to-json/serializer'
import { expect } from 'vitest'

configure({ adapter: new Adapter() })
expect.addSnapshotSerializer(enzymeSerializer)
