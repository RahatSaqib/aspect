import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  clinicalIndicators: {
    id: 'pages.Status.clinicalIndicators',
    defaultMessage: 'Clinical Indicators',
    dateFormat: {
      id: 'pages.Status.clinicalIndicators.dateFormat',
      defaultMessage: 'MMM yyyy',
    },
    HIV: {
      name: {
        id: 'pages.Status.clinicalIndicators.HIV.name',
        defaultMessage: 'HIV',
      },
      title: {
        id: 'pages.Status.clinicalIndicators.HIV.title',
        defaultMessage: 'VL Outcomes',
      },
      pie: {
        legend: {
          id: 'pages.Status.clinicalIndicators.HIV.pie.legend',
          defaultMessage: 'Average Monthly Suppression Rate',
        },
      },
    },
    TB: {
      name: {
        id: 'pages.Status.clinicalIndicators.TB.name',
        defaultMessage: 'TB',
      },
      title: {
        id: 'pages.Status.clinicalIndicators.TB.title',
        defaultMessage: 'TB Outcomes',
      },
      pie: {
        legend: {
          id: 'pages.Status.clinicalIndicators.TB.pie.legend',
          defaultMessage: 'Average Monthly Suppression Rate',
        },
      },
    },
    CV: {
      name: {
        id: 'pages.Status.clinicalIndicators.CV.name',
        defaultMessage: 'Daily Confirmed Cases',
      },
      pie: {
        legend: {
          id: 'pages.Status.clinicalIndicators.CV.pie.legend',
          defaultMessage: 'Average Positive Rate',
        },
      },
    },
  },
})

export default messages
