import Immutable from 'immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { DeviceStatus } from './DeviceStatus'

describe('Device Status component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    title: 'Devices',
    cssClasses: 'Section__Content',
    deviceSummaryMap: Immutable.fromJS({
      operational: {
        deviceIds: [38, 86],
        items: [
          {
            key: 0,
            count: 2,
            total: 53,
            titleI18nKey: 'ofTotalDevicesTitle',
            subI18nKey: 'fullyOperationalStatus',
          },
        ],
      },
      warrantyExpiring: {
        deviceIds: [16],
        items: [
          {
            key: 0,
            count: 16,
            titleI18nKey: 'devicesTitle',
            subI18nKey: 'warrantyExpiringStatus',
          },
        ],
      },
      calibration: {
        deviceIds: [20],
        items: [
          {
            key: 0,
            count: 15,
            titleI18nKey: 'devicesTitle',
            subI18nKey: 'needCalibrationStatus',
          },
        ],
      },
      uploadingData: {
        deviceIds: [88, 109],
        items: [
          {
            key: 0,
            count: 50,
            titleI18nKey: 'devicesTitle',
            subI18nKey: 'notReportingStatus',
          },
        ],
      },
      testFailures: {
        deviceIds: [37],
        items: [
          {
            key: 0,
            count: 11,
            titleI18nKey: 'devicesTitle',
            subI18nKey: 'highFailuresRatesStatus',
          },
        ],
      },
    }),
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<DeviceStatus {...props} />)

    expect(element).toMatchSnapshot()
  })
})
