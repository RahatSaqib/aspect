import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { RawDataDialog } from './RawDataDialog'

describe('RawDataDialog module', () => {
  const props = { isShown: true, logs: [] }

  describe('RawDataDialog component', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(<RawDataDialog {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
