import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Card from '@material-ui/core/Card'
import { TargetStatus } from './TargetStatus'

describe('Target Status component', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    isShow: true,
    title: 'Progress Indicators',
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
        thresholdPercentageDataCollection: 95,
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
        thresholdPercentageDataCollection: 95,
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
        thresholdPercentageDataCollection: 95,
        link: '/browse/result',
        count: 1220,
        dataCollection: '75%',
      },
    ]),
  }

  it('should shallow render without crash', () => {
    shallow(<TargetStatus {...props} />)
  })

  it('should render Cards when the `isShow` prop is set', () => {
    const wrapper = shallow(<TargetStatus {...props} isShow={false} />)
    expect(wrapper.find(Card)).toHaveLength(0)

    wrapper.setProps({ isShow: true })
    expect(wrapper.find(Card)).toHaveLength(1)
  })

  it('should only render the targret summary cards which contains `target` property', () => {
    const wrapper = shallow(<TargetStatus {...props} />)
    expect(wrapper.find('.TargetItemBlockContainer').children()).toHaveLength(3)
  })
})
