import _ from 'lodash'
import Immutable from 'immutable'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import FallbackUntilDone from '../../components/shared/FallbackUntilDone'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField from '../../filter/geography/StateSelectField'
import LgaSelectField from '../../filter/geography/LgaSelectField'
import FiltersPanel from '../../filter/popover/FiltersPanel'
import styles from './StyleguideMain.css'

import ConnectedTagInput from '../../tag/ConnectedTagInput'
import { fetchTags, updateTags } from '../../tag/TagRedux'

import DetailPanel from '../../components/shared/detailPanel/DetailPanel'

const messages = defineMessages({
  title: {
    id: 'pages.StyleguideMain.title',
    defaultMessage: 'Styleguide',
  },
  filterTemplate: {
    id: 'pages.ManageDevices.filterTemplate',
    defaultMessage: 'Viewing all devices<GEOGRAPHY><NAME>.',
  },
  filterTemplateOptional: {
    id: 'pages.ManageDevices.filterTemplateOptional',
    defaultMessage: 'Counting only <ASSAY> assays<RESULT><DATE>.',
  },
})

const enhance = compose(
  pure,
  connect(
    state => ({
      tags: state.tag.tags,
    }),
    bindActionCreators.bind(null, {
      fetchTags,
      updateTags,
    })
  ),
  injectIntl,
  setPropTypes({
    intl: intlShape.isRequired,
  })
)

export class StyleguideMain extends PureComponent {
  state = {
    filter: {},
    countryId: null,
    stateId: null,
    lgaId: null,
    resultId: 23,
    siteId: 16,
  }

  componentDidMount() {
    this.props.fetchTags(this.state.resultId, 'result')
  }

  handleChangeFilter = filter => {
    this.setState(state => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    }))
  }

  handleCountryIdChange = countryId => {
    this.setState({ countryId })
  }

  handleStateIdChange = stateId => {
    this.setState({ stateId })
  }

  handleLgaIdChange = lgaId => {
    this.setState({ lgaId })
  }

  handleResultTagChange = (qryId, qryType, tags) => {
    console.log(qryId, qryType, tags)
    this.props.updateTags(qryId, qryType, tags.join(','))
  }

  handleSiteTagChange = (qryId, qryType, tags) => {
    console.log(qryId, qryType, tags)
    this.props.updateTags(qryId, qryType, tags.join(','))
  }

  render() {
    const { intl, tags } = this.props
    const { resultId, siteId } = this.state
    const { formatMessage } = intl
    const resultTags = tags.getIn(['result', resultId], Immutable.List()).toJS()
    const siteTags = tags.getIn(['site', siteId], Immutable.List()).toJS()

    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.title)} />
        <h1>Styleguide</h1>

        <div style={{ padding: '30px' }}>
          <DetailPanel intl={intl} data={mockData} />
        </div>

        <div style={{ padding: '30px' }}>
          <ConnectedTagInput
            qryId={resultId}
            qryType="result"
            allowCreate
            onTagChange={this.handleResultTagChange}
            value={resultTags}
          />
        </div>

        <div style={{ padding: '30px' }}>
          <ConnectedTagInput
            qryId={siteId}
            qryType="site"
            allowCreate
            onTagChange={this.handleResultTagChange}
            value={siteTags}
          />
        </div>

        <FallbackUntilDone
          fallbacks={[
            { style: { width: '100px' } },
            { style: { width: '200px' } },
            { style: { width: '300px' } },
          ]}
          isDone={node => node.getBoundingClientRect().width >= 400}
        >
          <div>98tyfchgvjbknl</div>
        </FallbackUntilDone>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <FiltersPanel
            intl={intl}
            onClearFilter={_.noop}
            onChangeFilters={this.handleChangeFilter}
            filters={this.state.filter}
            config={{
              assayAndResultCategory: true,
              geography: true,
              state: true, // under geography, optional
              lga: true, // under geography, optional
              date: true,
              partnerId: true,
              patientOrResearchId: true,
              sampleId: true,
              sampleGroup: true,
              deviceName: true,
              siteName: true,
              sampleOriginSite: true,
              contactNameOrEmail: true,
              consumable: true,
              workflowStatus: true,
              deviceStatus: true,
              externalId: true,
            }}
            contentClassName={styles.FiltersPanel__Content}
            filterTemplate={formatMessage(messages.filterTemplate)}
            filterTemplateOptional={formatMessage(
              messages.filterTemplateOptional
            )}
          />
        </div>
        <CountrySelectField
          onCountryIdChange={this.handleCountryIdChange}
          countryId={this.state.countryId}
        />
        <StateSelectField
          onStateIdChange={this.handleStateIdChange}
          countryId={this.state.countryId}
          stateId={this.state.stateId}
        />
        <LgaSelectField
          onLgaIdChange={this.handleLgaIdChange}
          countryId={this.state.countryId}
          stateId={this.state.stateId}
          lgaId={this.state.lgaId}
        />
      </div>
    )
  }
}

export default enhance(StyleguideMain)

const mockData = Immutable.fromJS({
  id: 996,
  externalId: 'UQTB-984-2',
  startedOn: '2018-04-12T02:54:49.000Z',
  endedOn: '2018-04-12T04:34:49.000Z',
  deviceId: 55,
  deviceName: 'GeneXpert #34 Wayne, OH #1',
  countryName: 'United States',
  stateName: 'Ohio',
  lgaName: 'Wayne',
  resultCategory1Name: 'Detected',
  resultCategory2Name: 'Not Detected',
  resultWorkflowStatusId: 3,
  resultWorkflowStatus: 'Ordered',
  resultWorkflowStatusExternalId: 'Ordered',
  resultData: {
    probes: {
      qc1: 'YES',
      qc2: 'No',
      qc1Ct: 1,
      qc2Ct: 0.007,
      probeA: 'NEG',
      probeB: 'POS',
      probeC: 'NO RESULT',
      probeD: 'NEG',
      probeE: 'POS',
      probeACt: 12.32,
      probeBCt: 11.2,
      probeCCt: 12.5,
      probeDCt: 0.5,
      probeECt: 1.2,
      probeSpc: 'NO RESULT',
      qc1Endpt: 0.1234,
      qc2Endpt: 1.22,
      probeSpcCt: 5.78,
      probeAEndpt: 1.6,
      probeBEndpt: 2.33,
      probeCEndpt: 457,
      probeDEndpt: 12.43,
      probeEEndpt: 3.14,
      probeSpcEndpt: 8.9018,
    },
    resultText: 'MTB Detected, Rif Resistance Not Detected',
  },
  siteId: 35,
  siteName: 'Wayne County Ohio #1',
  assayVersion: '4',
  consumableSerial: '98412',
  consumableLot: 'Lot 4',
  consumableExpirationDate: '2040-09-28T02:54:43.000Z',
  instrumentSerial: 'S-1234-0',
  moduleName: 'Module A',
  moduleSerial: 'M-1234-0',
  researchId: 'R-ID-984',
  senderVersion: '4.6b',
  senderOperator: 'Marsha',
  notes: 'This is a test... result',
  errorCode: null,
  errorNotes: null,
  createdOn: '2018-04-17T02:54:43.000Z',
  updatedOn: '2018-04-17T02:54:43.000Z',
  assayId: 1,
  sampleId: 'SMP-TB-484',
  sampleGroup: 'GRP-HIV-4',
  sampleOriginSiteId: 103,
  sampleCollectedOn: '2017-10-11T02:54:58.000Z',
  sampleOriginSiteName: 'Kawkareik District Kayin #3',
  sampleTypeName: 'DBS',
  patientId: '36352641-1',
  patientData: {
    id: '36352641-1',
    age: 58,
    hiv: '',
    zip: '07707',
    city: 'Columbia',
    name: 'Lydia Mckinney',
    phone: '1-762-703-7121',
    state: 'MO',
    gender: '',
    street: '773 Vel Rd.',
  },
  qcCheck: 0,
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
          probeACt: {
            type: 'number',
            title: 'Probe A Ct',
          },
          probeBCt: {
            type: 'number',
            title: 'Probe B Ct',
          },
          probeCCt: {
            type: 'number',
            title: 'Probe C Ct',
          },
          probeDCt: {
            type: 'number',
            title: 'Probe D Ct',
          },
          probeECt: {
            type: 'number',
            title: 'Probe E Ct',
          },
          probeSpc: {
            type: 'string',
            title: 'Probe Spc',
          },
          qc1Endpt: {
            type: 'number',
            title: 'QC1 Endpt',
          },
          qc2Endpt: {
            type: 'number',
            title: 'QC2 Endpt',
          },
          probeSpcCt: {
            type: 'number',
            title: 'Probe Spc Ct',
          },
          probeAEndpt: {
            type: 'number',
            title: 'Probe A Endpt',
          },
          probeBEndpt: {
            type: 'number',
            title: 'Probe B Endpt',
          },
          probeCEndpt: {
            type: 'number',
            title: 'Probe C Endpt',
          },
          probeDEndpt: {
            type: 'number',
            title: 'Probe D Endpt',
          },
          probeEEndpt: {
            type: 'number',
            title: 'Probe E Endpt',
          },
          probeSpcEndpt: {
            type: 'number',
            title: 'Probe Spc Endpt',
          },
        },
      },
      resultText: {
        type: 'string',
        title: 'Result Text',
      },
    },
    patientDataSchema: {
      id: {
        type: 'string',
        order: 0,
        title: 'Patient ID',
      },
      age: {
        type: 'number',
        order: 8,
        title: 'Age (in years)',
      },
      hiv: {
        type: 'string',
        order: 7,
        title: 'HIV Status',
      },
      zip: {
        type: 'string',
        order: 5,
        title: 'Zip',
      },
      city: {
        type: 'string',
        order: 3,
        title: 'City',
      },
      name: {
        type: 'string',
        order: 1,
        title: 'Name',
      },
      phone: {
        type: 'string',
        order: 6,
        title: 'Phone',
      },
      state: {
        type: 'string',
        order: 4,
        title: 'State',
      },
      gender: {
        type: 'string',
        order: 9,
        title: 'Gender',
      },
      street: {
        type: 'string',
        order: 2,
        title: 'Street',
      },
    },
  },
  schema: {
    title: 'Test Result',
    icon: 'document',
    groups: {
      site: {
        order: 0,
        summary: {
          title: 'Lab',
          rows: {
            siteName: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'Deployment Full Name',
            },
          },
        },
        detail: {
          title: 'Lab',
          rows: {
            siteName: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'Deployment Full Name',
              link: '/browse/site/<%= siteId %>',
            },
            countryName: {
              type: 'string',
              row: 1,
              order: 0,
              title: 'Country',
            },
            stateName: {
              type: 'string',
              row: 1,
              order: 1,
              title: 'State',
            },
            lgaName: {
              type: 'string',
              row: 1,
              order: 2,
              title: 'City',
            },
          },
        },
      },

      assay: {
        order: 1,
        summary: {
          title: 'Assay Type',
          rows: {
            name: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'Assay Type',
            },
          },
        },
        detail: {
          title: 'Assay',
          rows: {
            name: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'Assay Type',
            },
            consumableLot: {
              type: 'string',
              row: 0,
              order: 1,
              title: 'Reagent Lot ID',
            },
            consumableSerial: {
              type: 'string',
              row: 0,
              order: 2,
              title: 'Cartridge Serial',
            },
            consumableExpirationDate: {
              type: 'date',
              row: 0,
              order: 3,
              title: 'Expiration Date',
            },
            instrumentSerial: {
              type: 'string',
              row: 1,
              order: 0,
              title: 'Instrument Serial',
            },
            moduleSerial: {
              type: 'string',
              row: 1,
              order: 1,
              title: 'Module Serial',
            },
            senderOperator: {
              type: 'string',
              row: 1,
              order: 2,
              title: 'Operator',
            },
            notes: {
              type: 'string',
              row: 2,
              order: 0,
              title: 'Reason For Test',
            },
          },
        },
      },
      date: {
        order: 2,
        summary: {
          title: 'Start Date',
          rows: {
            startedOn: {
              type: 'time',
              row: 0,
              order: 0,
              title: 'Start Date',
            },
          },
        },
        detail: {
          title: 'Date',
          rows: {
            startedOn: {
              type: 'time',
              row: 0,
              order: 0,
              title: 'Start Date',
            },
            endedOn: {
              type: 'time',
              row: 0,
              order: 1,
              title: 'End Date',
            },
            createdOn: {
              type: 'time',
              row: 1,
              order: 0,
              title: 'Added',
            },
            updatedOn: {
              type: 'time',
              row: 1,
              order: 1,
              title: 'Last Update',
            },
          },
        },
      },
      sample: {
        order: 3,
        summary: {
          title: 'Sample ID',
          rows: {
            sampleId: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'Sample ID',
            },
          },
        },
        detail: {
          title: 'Sample',
          rows: {
            sampleId: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'Sample ID',
            },
            sampleTypeName: {
              type: 'string',
              row: 0,
              order: 1,
              title: 'Sample Type',
            },
            sampleCollectedOn: {
              type: 'time',
              row: 0,
              order: 2,
              title: 'Sample Collection Date',
            },
            sampleOriginSiteName: {
              type: 'string',
              row: 1,
              order: 0,
              title: 'Sample Collection Site',
            },
            sampleCollectedBy: {
              type: 'time',
              row: 1,
              order: 1,
              title: 'Collected By',
            },
          },
        },
      },
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
          rows: {
            id: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'Patient ID',
            },
            age: {
              type: 'number',
              row: 0,
              order: 1,
              title: 'Age (in years)',
            },
            hiv: {
              type: 'string',
              row: 0,
              order: 2,
              title: 'HIV Status',
            },
            name: {
              type: 'string',
              row: 1,
              order: 0,
              title: 'Name',
            },
            phone: {
              type: 'string',
              row: 1,
              order: 1,
              title: 'Phone',
            },
          },
        },
      },
      result: {
        order: 5,
        summary: {
          title: 'Result',
          rows: {
            resultCategory1Name: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'MTB',
            },
            resultCategory2Name: {
              type: 'string',
              row: 0,
              order: 1,
              title: 'RIF',
            },
          },
        },
        detail: {
          title: 'Result',
          rows: {
            resultCategory1Name: {
              type: 'string',
              row: 0,
              order: 0,
              title: 'MTB',
            },
            resultCategory2Name: {
              type: 'string',
              row: 0,
              order: 1,
              title: 'RIF',
            },
          },
        },
      },
    },
  },
})
