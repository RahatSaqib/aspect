import React from 'react'
import { shallow } from 'enzyme'
import AspectExportListButton from '../components/AspectExportListButton'

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
    const element = shallow(<AspectExportListButton {...props} />)

    expect(element).toMatchSnapshot()
  })

  it('should shallow render export list correctly', () => {
    const element = shallow(<AspectExportListButton {...props} />)
    element.setProps({
      visible: true,
    })

    expect(element).toMatchSnapshot()
  })
})
