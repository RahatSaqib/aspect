import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'
import { TaskList } from './TaskList'
import { Items } from '../../../utils/metaReducers/items'
import { Table } from '../../../utils/metaReducers/table'

describe('TaskList module', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
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
