import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { SummaryStatus } from './SummaryStatus'
import { Unit } from '../../components/pureGrids'

describe('Summary Status component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    summary: Immutable.fromJS([
      {
        id: 13,
        icon: 'assignment',
        title: 'Tests',
        titleI18nKey: 'dashboardWidgetTitleTests',
        subTitle: 'This Month',
        subTitleI18nKey: 'dashboardWidgetSubTitleTests',
        statUnit: 'Tests',
        statUnitI18nKey: 'dashboardWidgetUnitTests',
        statStatus: null,
        statStatusI18nKey: null,
        extraUnit: null,
        extraUnitI18nKey: null,
        extraLabel: 'Successful',
        extraLabelI18nKey: 'dashboardWidgetExtraLabelTests',
        indicator: 0,
        coloredIndicator: 0,
        link: '/browse/result',
        count: 949,
        target: null,
        unit: null,
        extra: '61.43%',
        dashboard: ['home'],
      },
      {
        id: 14,
        icon: 'assignment',
        title: 'MTB+ Rate',
        titleI18nKey: 'dashboardWidgetTitleMTBPositiveRate',
        subTitle: 'Last 30 Days',
        subTitleI18nKey: 'dashboardWidgetSubTitleMTBPositiveRate',
        statUnit: 'for {unit} Results',
        statUnitI18nKey: 'dashboardWidgetUnitMTBPositiveRate',
        statStatus: 'MTB+',
        statStatusI18nKey: 'dashboardWidgetStatusMTBPositiveRate',
        extraUnit: null,
        extraUnitI18nKey: null,
        extraLabel: null,
        extraLabelI18nKey: null,
        indicator: 0,
        coloredIndicator: 0,
        link: '/browse/result',
        count: '68.29%',
        target: null,
        unit: 596,
        extra: null,
        dashboard: ['home', 'operational'],
      },
      {
        id: 15,
        icon: 'assignment',
        title: 'RR Rate',
        titleI18nKey: 'dashboardWidgetTitleRRRate',
        subTitle: 'Last 30 Days',
        subTitleI18nKey: 'dashboardWidgetSubTitleRRRate',
        statUnit: 'for {unit} MTB+',
        statUnitI18nKey: 'dashboardWidgetUnitRRRate',
        statStatus: 'Rif Resistant',
        statStatusI18nKey: 'dashboardWidgetStatusRRRate',
        extraUnit: null,
        extraUnitI18nKey: null,
        extraLabel: null,
        extraLabelI18nKey: null,
        indicator: 0,
        coloredIndicator: 0,
        link: '/browse/result',
        count: 0,
        target: null,
        unit: 407,
        extra: null,
        dashboard: ['home'],
      },
      {
        id: 16,
        icon: 'assignment',
        title: 'TI Rate',
        titleI18nKey: 'dashboardWidgetTitleTIRate',
        subTitle: 'Last 30 Days',
        subTitleI18nKey: 'dashboardWidgetSubTitleTIRate',
        statUnit: 'for {unit} MTB+',
        statUnitI18nKey: 'dashboardWidgetUnitTIRate',
        statStatus: 'Trace Indeterminate',
        statStatusI18nKey: 'dashboardWidgetStatusTIRate',
        extraUnit: null,
        extraUnitI18nKey: null,
        extraLabel: null,
        extraLabelI18nKey: null,
        indicator: 0,
        coloredIndicator: 0,
        link: '/browse/result',
        count: '22.21%',
        target: null,
        unit: 596,
        extra: null,
        dashboard: ['home'],
      },
    ]),
    defaultMessages: [],
  }

  it('should shallow render correctly', () => {
    shallow(<SummaryStatus {...props} />)
  })

  it('should shallow render correctly only one widget for Operational Data dashboard', () => {
    const wrapper = shallow(
      <SummaryStatus {...props} dashboard="operational" />
    )

    // get widgets with `dashboard` containing `operational`
    const items = props.summary.filter(widget =>
      widget.get('dashboard').includes('operational')
    )
    // check that actually rendered UI items is equal number of widgets
    expect(items.size).toEqual(1)
    expect(wrapper.find(Unit).length).toEqual(items.size)
  })
})
