import React from 'react'
import { shallow } from 'enzyme'

import { AspectExportListButtonWithProps } from '.'

describe('ExportListButton', () => {
  const props = {
    onExport: () => {},
    visible: false,
    downloadStarted: false,
    setDownloadStarted: () => {},
    anchorEl: null,
    setAnchorEl: () => {},
  }

  it('should not render the button', () => {
    const element = shallow(<AspectExportListButtonWithProps {...props} />)

    expect(element).toMatchSnapshot()
    expect(element.find('div')).toHaveLength(0)
  })

  it('should shallow render export list correctly', () => {
    const element = shallow(<AspectExportListButtonWithProps {...props} visible />)

    expect(element).toMatchSnapshot()
    expect(element.find('div')).toHaveLength(1)
  })
})
