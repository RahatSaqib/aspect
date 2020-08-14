const pieRowDataFromAPIIn = [
  {
    assayName: 'GeneXpert COVID-19',
    cntAll: 129,
    cntPositive: 37,
    cntAllReported: 0,
    cntReportedViaEmail: 0,
    cntReportedViaSms: 0,
    cntWithin2Hours: 0,
    percentPositive: 29,
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
  {
    assayName: 'GeneXpert Ebola',
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
    percentPositiveChange: -50,
    percentReportedChange: 0,
    percentViaEmailChange: 0,
    percentViaSmsChange: 0,
    percentWithin2HoursChange: 0,
  },
  {
    assayName: 'GeneXpert HCV',
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
    percentPositiveChange: -50,
    percentReportedChange: 0,
    percentViaEmailChange: 0,
    percentViaSmsChange: 0,
    percentWithin2HoursChange: 0,
  },
  {
    assayName: 'GeneXpert HIV-1 Qual',
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
  {
    assayName: 'GeneXpert HIV-1 VL',
    cntAll: 18,
    cntPositive: 13,
    cntAllReported: 0,
    cntReportedViaEmail: 0,
    cntReportedViaSms: 0,
    cntWithin2Hours: 0,
    percentPositive: 72,
    percentReported: 0,
    percentViaEmail: 0,
    percentViaSms: 0,
    percentWithin2Hours: 0,
    percentPositiveChange: 16,
    percentReportedChange: 0,
    percentViaEmailChange: 0,
    percentViaSmsChange: 0,
    percentWithin2HoursChange: 0,
  },
  {
    assayName: 'GeneXpert MTB/Rif',
    cntAll: 39,
    cntPositive: 10,
    cntAllReported: 0,
    cntReportedViaEmail: 0,
    cntReportedViaSms: 0,
    cntWithin2Hours: 0,
    percentPositive: 26,
    percentReported: 0,
    percentViaEmail: 0,
    percentViaSms: 0,
    percentWithin2Hours: 0,
    percentPositiveChange: 4,
    percentReportedChange: 0,
    percentViaEmailChange: 0,
    percentViaSmsChange: 0,
    percentWithin2HoursChange: 0,
  },
  {
    assayName: 'GeneXpert MTB/Rif Ultra',
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
  {
    assayName: 'GeneXpert Unknown',
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
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 129,
          valueLabel: 129,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
      value: [
        {
          id: 'cntPositive',
          label: 'cntPositive',
          value: 37,
          valueLabel: 37,
        },
      ],
    },
    {
      heading: 'percentPositive',
      type: 'doughnut',
      format: 'percent',
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 29,
          difference: 0,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 71,
          difference: 0,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
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
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
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
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 0,
          difference: -50,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 100,
          difference: -50,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
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
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
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
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 0,
          difference: -50,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 100,
          difference: -50,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
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
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'HIV-1 Qual',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
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
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
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
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 18,
          valueLabel: 18,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
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
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 72,
          difference: 16,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 28,
          difference: 16,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
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
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
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
      value: [
        {
          id: 'cntAll',
          label: 'cntAll',
          value: 39,
          valueLabel: 39,
        },
      ],
    },
    {
      heading: 'cntPositive',
      type: 'solid',
      format: 'int',
      value: [
        {
          id: 'cntPositive',
          label: 'cntPositive',
          value: 10,
          valueLabel: 10,
        },
      ],
    },
    {
      heading: 'percentPositive',
      type: 'doughnut',
      format: 'percent',
      value: [
        {
          id: 'percentPositive',
          label: 'percentPositive',
          value: 26,
          difference: 4,
        },
        {
          id: 'noData',
          label: 'noData',
          value: 74,
          difference: 4,
        },
      ],
    },
    {
      heading: 'percentReported',
      type: 'doughnut',
      format: 'percent',
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
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'MTB/Rif Ultra',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
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
  [
    {
      heading: 'assayName',
      type: 'string',
      format: 'string',
      value: [
        {
          id: 'assayName',
          label: 'assayName',
          value: 'Unknown',
        },
      ],
    },
    {
      heading: 'cntAll',
      type: 'solid',
      format: 'int',
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
