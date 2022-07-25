import React from 'react'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Default } from '../stories/IconProvider.stories'

describe('Icon Provider', () => {
  test('should use fallback icon if not valid', async () => {
    jest.spyOn(console, 'error')
    console.error.mockImplementation(() => {})
    const { container } = render(<Default {...Default.args} icon="IAmNotReal" />)
    await waitFor(() => expect(container.getElementsByTagName('title')[0]).toHaveTextContent('FaQuestionCircle'))
    console.error.mockRestore()
  })
  test('should render correct icon', async () => {
    const { container } = render(<Default {...Default.args} icon="MdAlarmOn" />)
    await waitFor(() => expect(container.getElementsByTagName('title')[0]).toHaveTextContent('MdAlarmOn'))
  })
})
