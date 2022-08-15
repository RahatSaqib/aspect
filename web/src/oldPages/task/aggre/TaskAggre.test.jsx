import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { createIntl } from 'react-intl'
import { TaskAggre } from './TaskAggre'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'

describe('TaskAggre module', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
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
