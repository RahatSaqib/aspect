import React from 'react'
import { shallow } from 'enzyme'

import { AspectExportListButton } from '.'

describe('ExportListButton', () => {
  const props = {
    onExcelClick: () => {},
    onCsvClick: () => {},
    visible: false,
    downloadStarted: false,
    setDownloadStarted: () => {},
    anchorEl: null,
    setAnchorEl: () => {},
  }

  it('should not render the button', () => {
    const element = shallow(<AspectExportListButton {...props} />)

    expect(element).toMatchSnapshot()
    expect(element.find('div')).toHaveLength(0)
  })

  it('should shallow render export list correctly', () => {
    const element = shallow(<AspectExportListButton {...props} />)
    element.setProps({
      visible: true,
    })

    expect(element).toMatchSnapshot()
    expect(element.find('div')).toHaveLength(1)
  })
})
