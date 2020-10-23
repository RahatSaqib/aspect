import React from 'react'
import { shallow } from 'enzyme'

import { ExportListButton } from './ExportListButton'

describe('ExportListButton', () => {
  const props = {
    onMyExport: () => {},
    visible: false,
    onPopoverClick: () => {},
    onPopoverClose: () => {},
    anchorEl: 0,
    downloadStarted: false,
  }

  it('should not render the button', () => {
    const element = shallow(<ExportListButton {...props} />)

    expect(element).toMatchSnapshot()
    expect(element.find('div')).toHaveLength(0)
  })

  it('should shallow render export list correctly', () => {
    const element = shallow(<ExportListButton {...props} />)
    element.setProps({
      visible: true,
    })

    expect(element).toMatchSnapshot()
    expect(element.find('div')).toHaveLength(1)
  })
})
