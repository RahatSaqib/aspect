import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'
import { TaskList } from './TaskList'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

describe('TaskList module', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    location: {
      search: '',
    },
    table: new Table(),
    items: new Items(),
    countByAlert: Immutable.Map(),
  }

  describe('TaskList component', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(<TaskList {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
