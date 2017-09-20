import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { DeviceStatus } from './DeviceStatus'

describe('ChartAlert component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    title: 'Devices',
    cssClasses: 'Section__Content',
    data: {
      calibration: [
        {
          0: {
            count: 3,
            key: 'calibration',
            subI18nKey: 'needCalibrationStatus',
            titleI18nKey: 'devicesTitle',
          },
        },
      ],
      operational: [
        {
          0: {
            count: 67,
            total: 83,
            titleI18nKey: 'countOfTotalDevicesTitle',
            subI18nKey: 'fullyOperationalStatus',
            key: 'operational',
          },
        },
      ],
      qualityControl: [
        {
          0: {
            count: 7,
            key: 'qualityControl',
            subI18nKey: 'withQCIssuesStatus',
            titleI18nKey: 'devicesTitle',
          },
        },
      ],
    },
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<DeviceStatus {...props} />)

    expect(element).toMatchSnapshot()
  })
})
