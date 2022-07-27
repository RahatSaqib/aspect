import format from 'date-fns/format'
import endOfMonth from 'date-fns/endOfMonth'

const now = new Date()
const lastDayOfMonth = format(endOfMonth(new Date()), 'dd')
const pieRowDataFromAPIIn = [
  {
    assayId: '16',
    assayName: 'GeneXpert HIV-1 VL',
    resultCategoryPositiveId: '18',
    cntAll: 42,
    cntPositive: 13,
    cntAllReported: 11,
    cntReportedViaEmail: 11,
    cntReportedViaSms: 10,
    cntWithin2Hours: 11,
    percentPositive: 31,
    percentReported: 85,
    percentViaEmail: 100,
    percentViaSms: 91,
    percentWithin2Hours: 100,
    percentPositiveChange: -10,
    percentReportedChange: 85,
    percentViaEmailChange: 100,
    percentViaSmsChange: 91,
    percentWithin2HoursChange: 100,
  },
  {
    assayId: '14',
    assayName: 'GeneXpert MTB/Rif',
    resultCategoryPositiveId: '1',
    cntAll: 42,
    cntPositive: 16,
    cntAllReported: 15,
    cntReportedViaEmail: 15,
    cntReportedViaSms: 12,
    cntWithin2Hours: 14,
    percentPositive: 38,
    percentReported: 94,
    percentViaEmail: 100,
    percentViaSms: 80,
    percentWithin2Hours: 93,
    percentPositiveChange: 16,
    percentReportedChange: 94,
    percentViaEmailChange: 100,
    percentViaSmsChange: 80,
    percentWithin2HoursChange: 93,
  },
  {
    assayId: '20',
    assayName: 'GeneXpert HCV',
    resultCategoryPositiveId: '1',
    cntAll: 9,
    cntPositive: 2,
    cntAllReported: 2,
    cntReportedViaEmail: 2,
    cntReportedViaSms: 2,
    cntWithin2Hours: 2,
    percentPositive: 22,
    percentReported: 100,
    percentViaEmail: 100,
    percentViaSms: 100,
    percentWithin2Hours: 100,
    percentPositiveChange: 22,
    percentReportedChange: 100,
    percentViaEmailChange: 100,
    percentViaSmsChange: 100,
    percentWithin2HoursChange: 100,
  },
  {
    assayId: '18',
    assayName: 'GeneXpert Ebola',
    resultCategoryPositiveId: '1',
    cntAll: 4,
    cntPositive: 2,
    cntAllReported: 2,
    cntReportedViaEmail: 2,
    cntReportedViaSms: 2,
    cntWithin2Hours: 2,
    percentPositive: 50,
    percentReported: 100,
    percentViaEmail: 100,
    percentViaSms: 100,
    percentWithin2Hours: 100,
    percentPositiveChange: 50,
    percentReportedChange: 100,
    percentViaEmailChange: 100,
    percentViaSmsChange: 100,
    percentWithin2HoursChange: 100,
  },
  {
    assayId: '33',
    assayName: 'GeneXpert COVID-19',
    resultCategoryPositiveId: '33',
    cntAll: 0,
    cntPositive: 0,
    cntAllReported: 0,
    cntReportedViaEmail: 0,
    cntReportedViaSms: 0,
    cntWithin2Hours: 0,
    percentPositive: 0,
    percentReported: 0,
    percentViaEmail: 0,
    percentViaSms: 0,
    percentWithin2Hours: 0,
    percentPositiveChange: 0,
    percentReportedChange: 0,
    percentViaEmailChange: 0,
    percentViaSmsChange: 0,
    percentWithin2HoursChange: 0,
  },
]

const pieRowDataFromAPIOut = [
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      link: false,
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'HIV-1 VL',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D16%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}`,
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 42,
          valueLabel: 42,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D16%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}%26resultCategoryId%3D18`,
      value: [
        {
          id: 'cntPositive',
          label: 'cntPositive',
          value: 13,
          valueLabel: 13,
        },
      ],
    },
    {
      heading: 'percentPositive',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 31,
          difference: -10,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 69,
          difference: -10,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentReported',
          label: 'percentReported',
          value: 85,
          difference: 85,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 15,
          difference: 85,
        },
      ],
    },
    {
      heading: 'percentViaEmail',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaEmail',
          label: 'percentViaEmail',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentViaSms',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaSms',
          label: 'percentViaSms',
          value: 91,
          difference: 91,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 9,
          difference: 91,
        },
      ],
    },
    {
      heading: 'percentWithin2Hours',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentWithin2Hours',
          label: 'percentWithin2Hours',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
  ],
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      link: false,
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'MTB/Rif',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D14%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}`,
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 42,
          valueLabel: 42,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D14%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}%26resultCategoryId%3D1`,
      value: [
        {
          id: 'cntPositive',
          label: 'cntPositive',
          value: 16,
          valueLabel: 16,
        },
      ],
    },
    {
      heading: 'percentPositive',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 38,
          difference: 16,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 62,
          difference: 16,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentReported',
          label: 'percentReported',
          value: 94,
          difference: 94,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 6,
          difference: 94,
        },
      ],
    },
    {
      heading: 'percentViaEmail',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaEmail',
          label: 'percentViaEmail',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentViaSms',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaSms',
          label: 'percentViaSms',
          value: 80,
          difference: 80,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 20,
          difference: 80,
        },
      ],
    },
    {
      heading: 'percentWithin2Hours',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentWithin2Hours',
          label: 'percentWithin2Hours',
          value: 93,
          difference: 93,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 7,
          difference: 93,
        },
      ],
    },
  ],
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      link: false,
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'HCV',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D20%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}`,
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 9,
          valueLabel: 9,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D20%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}%26resultCategoryId%3D1`,
      value: [
        {
          id: 'cntPositive',
          label: 'cntPositive',
          value: 2,
          valueLabel: 2,
        },
      ],
    },
    {
      heading: 'percentPositive',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 22,
          difference: 22,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 78,
          difference: 22,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentReported',
          label: 'percentReported',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentViaEmail',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaEmail',
          label: 'percentViaEmail',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentViaSms',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaSms',
          label: 'percentViaSms',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentWithin2Hours',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentWithin2Hours',
          label: 'percentWithin2Hours',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
  ],
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      link: false,
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'Ebola',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D18%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}`,
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 4,
          valueLabel: 4,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D18%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}%26resultCategoryId%3D1`,
      value: [
        {
          id: 'cntPositive',
          label: 'cntPositive',
          value: 2,
          valueLabel: 2,
        },
      ],
    },
    {
      heading: 'percentPositive',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 50,
          difference: 50,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 50,
          difference: 50,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentReported',
          label: 'percentReported',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentViaEmail',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaEmail',
          label: 'percentViaEmail',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentViaSms',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaSms',
          label: 'percentViaSms',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
    {
      heading: 'percentWithin2Hours',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentWithin2Hours',
          label: 'percentWithin2Hours',
          value: 100,
          difference: 100,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 0,
          difference: 100,
        },
      ],
    },
  ],
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      link: false,
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'COVID-19',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D33%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}`,
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 100,
          valueLabel: 0,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
      link: `/browse/result?filters=assayId%3D33%26minDate%3D${format(now, 'yyyy-MM')}-01%26maxDate%3D${format(
        now,
        'yyyy-MM'
      )}-${lastDayOfMonth}%26resultCategoryId%3D33`,
      value: [
        {
          id: 'cntPositive',
          label: 'cntPositive',
          value: 100,
          valueLabel: 0,
        },
      ],
    },
    {
      heading: 'percentPositive',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 0,
          difference: 0,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 100,
          difference: 0,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentReported',
          label: 'percentReported',
          value: 0,
          difference: 0,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 100,
          difference: 0,
        },
      ],
    },
    {
      heading: 'percentViaEmail',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaEmail',
          label: 'percentViaEmail',
          value: 0,
          difference: 0,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 100,
          difference: 0,
        },
      ],
    },
    {
      heading: 'percentViaSms',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentViaSms',
          label: 'percentViaSms',
          value: 0,
          difference: 0,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 100,
          difference: 0,
        },
      ],
    },
    {
      heading: 'percentWithin2Hours',
      type: 'doughnut',
      format: 'percent',
      link: false,
      value: [
        {
          id: 'percentWithin2Hours',
          label: 'percentWithin2Hours',
          value: 0,
          difference: 0,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 100,
          difference: 0,
        },
      ],
    },
  ],
]

export { pieRowDataFromAPIIn, pieRowDataFromAPIOut }
