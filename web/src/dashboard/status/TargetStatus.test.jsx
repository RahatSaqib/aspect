import Immutable from 'immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { TargetStatus } from './TargetStatus'

describe('Target Status component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    isShow: true,
    title: 'Testing Targets',
    className: 'Section--withStatus',
    stateName: undefined,
    targetSummaryList: Immutable.fromJS([
      {
        id: 17,
        layout: 'target',
        icon: 'assignment',
        title: 'MDR-TB',
        titleI18nKey: 'dashboardWidgetTitleMDRTB',
        lowerThanThreshold: 0,
        thresholdPercentageDataCollection: 60,
        link: '/browse/result',
        count: 897,
        target: 10000,
        dataCollection: '59.53%',
      },
      {
        id: 18,
        layout: 'target',
        icon: 'assignment',
        title: 'HIV+',
        titleI18nKey: 'dashboardWidgetTitleHIV',
        lowerThanThreshold: 0,
        thresholdPercentageDataCollection: 50,
        link: '/browse/result',
        count: 533,
        target: 2536,
        dataCollection: '45%',
      },
      {
        id: 19,
        layout: 'target',
        icon: 'assignment',
        title: 'Smear+',
        titleI18nKey: 'dashboardWidgetTitleSmear',
        lowerThanThreshold: 0,
        thresholdPercentageDataCollection: 50,
        link: '/browse/result',
        count: 1220,
        target: 1200,
        dataCollection: '75%',
      },
      {
        id: 20,
        layout: 'target',
        icon: 'assignment',
        title: 'Children',
        titleI18nKey: 'dashboardWidgetTitleChildren',
        lowerThanThreshold: 0,
        thresholdPercentageDataCollection: 50,
        link: '/browse/result',
        count: 986,
        target: 2190,
        dataCollection: '55%',
      },
    ]),
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<TargetStatus {...props} />)

    expect(element).toMatchSnapshot()
  })
})
