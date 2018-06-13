import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { TaskAggre } from './TaskAggre'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

describe('TaskAggre module', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    location: {
      search: '',
    },
    table: new Table(),
    items: new Items(),
  }

  describe('TaskAggre component', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(<TaskAggre {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
