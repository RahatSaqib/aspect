import Immutable from 'immutable'
import React from 'react'
import { IntlProvider } from 'react-intl'
import ReactTestRenderer from 'react-test-renderer'
import DetailPanel, { DetailGroup } from './DetailPanel'

describe('DetailPanel module', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  describe('DetailGroup component', () => {
    it('should render correctly', () => {
      const element = ReactTestRenderer.create(
        <DetailGroup
          intl={intl}
          groupSchema={screenSchema.getIn(['groups', 'patientData'])}
          rawData={data}
          data={data.get('patientData')}
        />
      )
      expect(element).toMatchSnapshot()
    })
  })

  describe('DetailPanel component', () => {
    it('should render correctly', () => {
      const element = ReactTestRenderer.create(
        <DetailPanel intl={intl} data={data} schema={screenSchema} />
      )
      expect(element).toMatchSnapshot()
    })
  })
})

const screenSchema = Immutable.fromJS({
  title: 'Test Result',
  icon: 'document',
  groups: {
    patientData: {
      order: 4,
      summary: {
        title: 'Patient ID',
        rows: {
          id: {
            type: 'string',
            row: 0,
            order: 0,
            title: 'Patient ID',
          },
        },
      },
      detail: {
        title: 'Patient',
        dataSchema: 'assay.patientDataSchema',
      },
    },
  },
})

const data = Immutable.fromJS({
  patientData: {
    id: '23116150-3',
    age: 78,
    hiv: 'Unknown',
    zip: '68832',
    city: 'Lasnigo',
    name: 'Alma Atkinson',
    phone: '945-5544',
    state: 'Lombardia',
    gender: '',
    street: 'Ap #465-698 Pellentesque Street',
  },
  assay: {
    id: 1,
    name: 'GeneXpert MTB/Rif',
    i18nKey: 'assayGeneXpertMtbRif',
    externalId: 'GxMtbRif',
    assayTypeId: 1,
    deviceTypeId: 1,
    resultSourceId: 1,
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMtb',
    resultCategory2Label: 'Rif',
    resultCategory2i18nKey: 'resultCategoryRif',
    resultDataSchema: {
      probes: {
        type: 'object',
        title: 'Probes',
        i18nKey: 'Probes',
        properties: {
          qc1: {
            type: 'string',
            title: 'QC1',
          },
          qc2: {
            type: 'string',
            title: 'QC2',
          },
          qc1Ct: {
            type: 'number',
            title: 'QC1 Ct',
          },
          qc2Ct: {
            type: 'number',
            title: 'QC2 Ct',
          },
          probeA: {
            type: 'string',
            title: 'Probe A',
          },
          probeB: {
            type: 'string',
            title: 'Probe B',
          },
          probeC: {
            type: 'string',
            title: 'Probe C',
          },
          probeD: {
            type: 'string',
            title: 'Probe D',
          },
          probeE: {
            type: 'string',
            title: 'Probe E',
          },
        },
      },
      resultText: {
        type: 'string',
        title: 'Result Text',
      },
    },
  },
})
