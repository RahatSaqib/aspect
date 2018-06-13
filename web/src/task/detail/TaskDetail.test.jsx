import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'

import { TaskDetail } from './TaskDetail'

describe('TaskDetail module', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    location: {
      search: '',
    },
    match: {
      params: {
        taskId: '1',
      },
    },
    onBackClick: () => {},
  }

  describe('TaskDetail component', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(<TaskDetail {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
