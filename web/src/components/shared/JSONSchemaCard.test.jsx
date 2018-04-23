import Immutable from 'immutable'
import React from 'react'
import ReactTestRenderer from 'react-test-renderer'

import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import JSONSchemaCard, { PropertiesSchemaCard } from './JSONSchemaCard'

describe('JSONSchemaCard module', () => {
  describe('PropertiesSchemaCard testInstance', () => {
    it('should handle nested field expanding correctly', () => {
      const testInstance = ReactTestRenderer.create(
        <PropertiesSchemaCard
          title="Data"
          initiallyExpanded
          renderField={field => <ReadOnlyField {...field} />}
          dataSchema={dataSchema.getIn(['probes', 'properties'])}
          data={data.get('probes')}
        />
      )
      expect(testInstance).toMatchSnapshot()
    })
  })

  describe('JSONSchemaCard testInstance', () => {
    it('should render correctly', () => {
      const testInstance = ReactTestRenderer.create(
        <JSONSchemaCard
          title="Data"
          renderField={field => <ReadOnlyField {...field} />}
          dataSchema={dataSchema}
          data={data}
        />
      )
      expect(testInstance).toMatchSnapshot()
    })
  })
})

const dataSchema = Immutable.fromJS({
  copies: {
    list: true,
    title: 'Copies/mL',
    type: 'number',
  },
  log: {
    title: 'log',
    type: 'number',
  },
  probes: {
    i18nKey: 'probes',
    properties: {
      cicCt: {
        title: 'CIC Ct',
        type: 'number',
      },
      cicEndPt: {
        title: 'CIC EndPt',
        type: 'number',
      },
      gpCt: {
        title: 'GP Ct',
        type: 'number',
      },
      gpEndPt: {
        title: 'GP Endpt',
        type: 'number',
      },
      npCt: {
        title: 'NP Ct',
        type: 'number',
      },
      npEndPt: {
        title: 'NP EndPt',
        type: 'number',
      },
      qc1Ct: {
        title: 'QC1 Ct',
        type: 'number',
      },
      qc1Endpt: {
        title: 'QC1 EndPt',
        type: 'number',
      },
      qc2Ct: {
        title: 'QC2 Ct',
        type: 'number',
      },
      qc2Endpt: {
        title: 'Qc2Endpt',
        type: 'number',
      },
      sacCt: {
        title: 'SAC Ct',
        type: 'number',
      },
      sacEndPt: {
        title: 'SAC EndPt',
        type: 'number',
      },
    },
    title: 'Probes',
    type: 'object',
  },
  resultText: {
    i18nKey: 'resultText',
    title: 'Result Text',
    type: 'string',
  },
})

const data = Immutable.fromJS({
  copies: 60173,
  log: 1.64,
  probes: {
    cicCt: 23.9,
    cicEndPt: 289,
    gpCt: 25.4,
    gpEndPt: 558,
    npCt: 12.2,
    npEndPt: null,
    qc1Ct: 0.32,
    qc1Endpt: 0,
    qc2Ct: 11.4,
    qc2Endpt: 0.5,
    sacCt: 33.8,
    sacEndPt: 650,
  },
  resultText: 'HIV-1 DÉTECTÉ 60173 copies/mL (log 1.64)',
})
