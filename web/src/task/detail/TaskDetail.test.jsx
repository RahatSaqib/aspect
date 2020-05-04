import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { createIntl } from 'react-intl'

import { TaskDetail } from './TaskDetail'

describe('TaskDetail module', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
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
