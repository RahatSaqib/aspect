import React from 'react'
import { createIntl } from 'react-intl'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'
import { TaskAggre } from './TaskAggre'

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
