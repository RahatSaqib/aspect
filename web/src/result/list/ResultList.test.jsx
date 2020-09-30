import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { Table } from '../../shared/metaReducers/table'
import { Items } from '../../shared/metaReducers/items'
import ExportListButton from '../../globals/components/ExportListButton'
import AspectExportListButton from '../../MigratedComponents/AspectExportListButton'

import mockState from './ResultList.mocked-data'

jest.mock('react-helmet', () => ({
  Helmet: jest.fn(),
}))

jest.mock('./messages', () => ({}))

jest.mock('react-intl', () => ({
  injectIntl: jest.fn(),
  createIntl: jest.fn(),
  defineMessages: jest.fn(),
  useIntl: () => ({
    formatMessage: () => jest.fn(),
  }),
}))
jest.mock('react-router-dom', () => ({
  useHistory: jest.fn(),
  useLocation: () => jest.fn(),
}))
jest.mock('react-redux', () => ({
  connect: () => jest.fn(),
  useDispatch: jest.fn(),
  useSelector: jest.fn().mockImplementation(cb => cb(mockState)),
}))
jest.mock('recompose', () => ({
  compose: jest.fn(() => jest.fn()),
  defaultProps: jest.fn(),
  lifecycle: jest.fn(),
  mapProps: jest.fn(),
  pure: jest.fn(),
  setPropTypes: jest.fn(),
  withHandlers: jest.fn(),
  withProps: jest.fn(),
  withState: jest.fn(),
  withStateHandlers: jest.fn(),
}))

describe('Result List component', () => {
  const { ResultList } = require('./ResultList')

  let props

  beforeEach(() => {
    props = {
      intl: createIntl({ locale: 'en' }),
      history: {
        push: () => {},
      },
      location: {
        search: '',
      },
      table: new Table(),
      items: new Items(),
      sortCol: 'id',
      sortDir: 'desc',
      pageAt: 0,
      pageSize: 10,
      onHeadColumnClick: () => {},
      onRowClick: () => {},
      onExcelClick: () => {},
    }
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should shallow render correctly when filter for assay type', () => {
    const element = shallow(<ResultList {...props} />)

    // const element = shallow(
    //   <ResultList location={{ search: '?filters=assayType%3DTB' }} />
    // )

    expect(element).toMatchSnapshot()
    expect(element.find(AspectExportListButton)).toHaveLength(1)
    // expect(element.find(ExportListButton)).toHaveLength(1)
  })
})
