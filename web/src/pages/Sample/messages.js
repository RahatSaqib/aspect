import { defineMessages } from 'react-intl'

const messages = defineMessages({
  samplesTitle: {
    id: 'pages.SampleList.samplesTitle',
    defaultMessage: 'Samples',
  },
  samplesSubtitle: {
    id: 'pages.SampleList.samplesSubtitle',
    defaultMessage: 'Registered samples with results and details',
  },
  sampleCollectionSite: {
    id: 'samples.sampleCollectionSite',
    defaultMessage: 'Sample Collection Site',
  },
  sampleCollectedOn: {
    id: 'samples.sampleCollectedOn',
    defaultMessage: 'Sample Collection Date',
  },
  sampleCollectedBy: {
    id: 'samples.sampleCollectedBy',
    defaultMessage: 'Sample Collected By',
  },
  sampleId: {
    id: 'samples.sampleId',
    defaultMessage: 'Sample ID',
  },
  patientId: {
    id: 'samples.patientId',
    defaultMessage: 'Patient ID',
  },
  dateUploadedToAspect: {
    id: 'samples.dateUploadedToAspect',
    defaultMessage: 'Date Uploaded to Aspect',
  },
  result: {
    id: 'samples.result',
    defaultMessage: 'Result',
  },
  resultDate: {
    id: 'samples.resultDate',
    defaultMessage: 'Result Date',
  },
  paginatorStatus: {
    id: 'pages.SampleList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# sample}
      other {# samples}
    }`,
  },
})

export default messages
