import Immutable from 'immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { createIntl } from 'react-intl'
import { SiteStatus } from './SiteStatus'

describe('Site Status component', () => {
  const renderer = new ReactShallowRenderer()

  const props = {
    intl: createIntl({ locale: 'en' }),
    title: 'Sites',
    cssClasses: 'Section__Content',
    siteSummaryMap: Immutable.fromJS({
      onlineNow: {
        siteIds: [17, 21],
        items: [
          {
            key: 0,
            count: 2,
            total: 27,
            titleI18nKey: 'ofTotalSitesTitle',
            subI18nKey: 'reportingStatus',
          },
        ],
      },
      stockManagement: {
        siteIds: [12],
        items: [
          {
            key: 0,
            count: 1,
            total: 27,
            titleI18nKey: 'ofTotalSitesTitle',
            subI18nKey: 'withStockIssues',
          },
        ],
      },
      deviceManagement: {
        siteIds: [9, 12, 50],
        items: [
          {
            key: 0,
            count: 3,
            total: 27,
            titleI18nKey: 'ofTotalSitesTitle',
            subI18nKey: 'withDeviceIssues',
          },
        ],
      },
      uploadingData: {
        siteIds: [12],
        items: [
          {
            key: 0,
            count: 1,
            total: 27,
            titleI18nKey: 'ofTotalSitesTitle',
            subI18nKey: 'notReportingStatus',
          },
        ],
      },
    }),
    deviceSummaryMap: Immutable.fromJS({
      operational: {
        deviceIds: [38, 86],
        siteIds: [20],
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
        siteIds: [1],
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
        siteIds: [20],
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
        siteIds: [11, 12],
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
    const element = renderer.render(<SiteStatus {...props} />)

    expect(element).toMatchSnapshot()
  })
})
