import React from 'react'
import Immutable from 'immutable'
import { createIntl } from 'react-intl'
import { shallowWithQuery } from '../../../__setup__/common'
import { SummaryStatus } from './SummaryStatus'

describe('Summary Status component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    allSummaryItems: Immutable.fromJS({
      13: {
        id: 13,
        icon: 'MdAssignment',
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
        dashboards: {
          operational: {
            groupI18nKey: 'summaryWidgetGroupInventory',
          },
        },
      },
      14: {
        id: 14,
        icon: 'MdAssignment',
        title: 'MTB+ Rate',
        titleI18nKey: 'dashboardWidgetTitleMTBPositiveRate',
        subTitle: 'Last 30 Days',
        subTitleI18nKey: 'dashboardWidgetSubTitleMTBPositiveRate',
        statUnit: 'for {unit} Results',
        statUnitI18nKey: 'forResults',
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
        dashboards: {
          operational: {
            groupI18nKey: 'summaryWidgetGroupInventory',
          },
        },
      },
      15: {
        id: 15,
        icon: 'MdAssignment',
        title: 'RR Rate',
        titleI18nKey: 'dashboardWidgetTitleRRRate',
        subTitle: 'Last 30 Days',
        subTitleI18nKey: 'dashboardWidgetSubTitleRRRate',
        statUnit: 'for {unit} MTB+',
        statUnitI18nKey: 'forMtbPositive',
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
        dashboards: {
          operational: {
            groupI18nKey: 'summaryWidgetGroupDevices',
          },
        },
      },
      16: {
        id: 16,
        icon: 'MdAssignment',
        title: 'TI Rate',
        titleI18nKey: 'dashboardWidgetTitleTIRate',
        subTitle: 'Last 30 Days',
        subTitleI18nKey: 'dashboardWidgetSubTitleTIRate',
        statUnit: 'for {unit} MTB+',
        statUnitI18nKey: 'forMtbPositive',
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
        dashboards: {
          operational: {
            groupI18nKey: 'summaryWidgetGroupDevices',
          },
        },
      },
    }),
    summary: Immutable.fromJS({
      currentIdList: ['13', '14', '15', '16'],
      widgetGroups: {
        summaryWidgetGroupInventory: ['13', '14'],
        summaryWidgetGroupDevices: ['15', '16'],
      },
    }),
    defaultMessages: [],
  }

  it('should shallow render correctly', () => {
    shallowWithQuery(<SummaryStatus {...props} />)
  })
})
