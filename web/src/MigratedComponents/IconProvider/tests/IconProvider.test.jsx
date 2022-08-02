import React from 'react'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Default } from '../stories/IconProvider.stories'

describe('Icon Provider', () => {
  test('should use fallback icon if not valid', async () => {
    jest.spyOn(console, 'error')
    console.error.mockImplementation(() => {})
    const { container } = render(<Default {...Default.args} icon="IAmNotReal" />)
    await waitFor(() =>
      expect(container.getElementsByTagName('path')[0]).toHaveAttribute(
        'd',
        'M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z'
      )
    )
    console.error.mockRestore()
  })
  test('should render correct icon', async () => {
    const { container } = render(<Default {...Default.args} icon="MdHelp" />)
    await waitFor(() =>
      expect(container.getElementsByTagName('path')[0]).toHaveAttribute(
        'd',
        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z'
      )
    )
  })
})
