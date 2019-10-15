import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions'
import { defineMessages } from 'react-intl'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Milestones.css'))

const sampleTexts = {
  sampleId: {
    id: 'pages.Milestones.sampleId',
    defaultMessage: 'Sample Id ',
  },
  originalSiteName: {
    id: 'pages.Milestones.originalSiteName',
    defaultMessage: 'Original site name: ',
  },
  sampleCollectedOn: {
    id: 'pages.Milestones.sampleCollectedOn',
    defaultMessage: 'Collected On: ',
  },
  assayAbbreviation: {
    id: 'pages.Milestones.assayAbbreviation',
    defaultMessage: 'Assay type: ',
  },
  notes: {
    id: 'pages.Milestones.notes',
    defaultMessage: 'Notes: ',
  },
}

const resultsTexts = {
  result: {
    id: 'pages.Milestones.resultNotes',
    defaultMessage: 'Result',
    header: true,
  },
  resultSiteName: {
    id: 'pages.Milestones.resultSiteName',
    defaultMessage: 'Lab: ',
  },
  assayType: {
    id: 'pages.Milestones.assayType',
    defaultMessage: 'Assay Type: ',
  },
  viewResultsDetails: {
    id: 'pages.Milestones.viewResultsDetails',
    defaultMessage: 'view Results Details ',
    link: true,
  },
  notes: {
    id: 'pages.Milestones.notes',
    defaultMessage: 'Notes: ',
  },
  sampleId: {
    id: 'pages.Milestones.sampleId',
    defaultMessage: 'SampleId: ',
  },
}

const treatmentTexts = {
  resultTreatmentStatusLogData: {
    id: 'pages.Milestones.resultTreatmentStatusLogData',
    defaultMessage: 'Treatment data:',
  },
  resultTreatmentStatusLogMethod: {
    id: 'pages.Milestones.resultTreatmentStatusLogMethod',
    defaultMessage: 'Treatment method: ',
  },
  resultTreatmentStatusLogCreatedBy: {
    id: 'pages.Milestones.resultTreatmentStatusLogCreatedBy',
    defaultMessage: 'Treatment created by: ',
  },
  notes: {
    id: 'pages.Milestones.notes',
    defaultMessage: 'Notes: ',
  },
  resultTreatmentName: {
    id: 'pages.Milestones.resultTreatmentName',
    defaultMessage: 'Treatment status ',
  },
}

const TimelineGenericPatientMilestone = ({
  title,
  details,
  link,
  expand,
  color,
}) => {
  const [expanded, setExpanded] = useState(expand)
  return (
    <ExpansionPanel
      onChange={(event, expanded) => setExpanded(expanded)}
      style={{
        width: '100%',
        display: 'table',
        backgroundColor: expanded ? 'white' : color,
      }}
    >
      <ExpansionPanelSummary
        expandIcon={expanded ? <span>-</span> : <span>+</span>}
      >
        <div style={{ width: '100%' }}>
          <div className={cssClasses('Summary__Title')}>{title.key}</div>
          <div
            className={cssClasses('Summary__Description')}
            style={{ bottom: 0 }}
          >
            {title.value}
          </div>
        </div>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails style={{ display: 'table' }}>
        <div style={{ width: '100%' }}>
          <ul>
            {details &&
              details.map(item => (
                <li>
                  <span className={cssClasses('Summary__Title')}>
                    {item.key}
                  </span>
                  <span className={cssClasses('Summary__Description')}>
                    {item.value}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </ExpansionPanelDetails>
      {link && (
        <ExpansionPanelActions style={{ width: '100%', marginRight: 10 }}>
          <Link
            to={link.to}
            className={cssClasses('Summary__Description__Link')}
          >
            {link.text}
          </Link>
        </ExpansionPanelActions>
      )}
    </ExpansionPanel>
  )
}

const TimelineItemResult = ({ result, intl }) => {
  const messagesResult = defineMessages(resultsTexts)
  const detailsFields = [
    {
      key: intl.formatMessage(messagesResult.resultSiteName),
      value: result.get('resultSiteName'),
    },
    {
      key: intl.formatMessage(messagesResult.resultSiteName),
      value: result.get('resultSiteName'),
    },
    {
      key: intl.formatMessage(messagesResult.assayType),
      value: result.get('assayAbbreviation'),
    },
    {
      key: intl.formatMessage(messagesResult.notes),
      value: result.get('notes'),
    },
    {
      key: intl.formatMessage(messagesResult.sampleId),
      value: result.get('sampleId'),
    },
  ]
  return (
    <TimelineGenericPatientMilestone
      title={{
        key: intl.formatMessage(messagesResult.result),
        value: result.get('resultNotes'),
      }}
      details={detailsFields}
      link={{
        to: `/browse/result/${result.resultId}`,
        text: intl.formatMessage(messagesResult.viewResultsDetails),
      }}
      expand={false}
      color="#c2f9e3"
    />
  )
}

const TimelineItemSample = ({ sample, intl }) => {
  const messages = defineMessages(sampleTexts)
  const detailsFields = [
    {
      key: intl.formatMessage(messages.originalSiteName),
      value: sample.get('originalSiteName'),
    },
    {
      key: intl.formatMessage(messages.sampleCollectedOn),
      value: sample.get('sampleCollectedOn'),
    },
    {
      key: intl.formatMessage(messages.assayAbbreviation),
      value: sample.get('assayAbbreviation'),
    },
    {
      key: intl.formatMessage(messages.notes),
      value: sample.get('notes'),
    },
  ]
  return (
    <TimelineGenericPatientMilestone
      title={{
        key: intl.formatMessage(messages.sampleId),
        value: sample.get('sampleId'),
      }}
      details={detailsFields}
      expand={false}
      color="#efe5d3"
    />
  )
}

const TimelineItemTreatment = ({ treatment, intl }) => {
  const messages = defineMessages(treatmentTexts)
  const detailsFields = [
    {
      key: intl.formatMessage(messages.resultTreatmentStatusLogData),
      value: treatment.get('resultTreatmentStatusLogData'),
    },
    {
      key: intl.formatMessage(messages.resultTreatmentStatusLogMethod),
      value: treatment.get('resultTreatmentStatusLogMethod'),
    },
    {
      key: intl.formatMessage(messages.resultTreatmentStatusLogCreatedBy),
      value: treatment.get('resultTreatmentStatusLogCreatedBy'),
    },
    {
      key: intl.formatMessage(messages.notes),
      value: treatment.get('notes'),
    },
  ]
  return (
    <TimelineGenericPatientMilestone
      title={{
        key: intl.formatMessage(messages.resultTreatmentName),
        value: treatment.get('resultTreatmentName'),
      }}
      details={detailsFields}
      expand={false}
      color="#c4ddfa"
    />
  )
}
const Milestones = ({ item, intl }) => {
  if (item.get('type') === 'Sample')
    return <TimelineItemSample sample={item} intl={intl} />
  if (item.get('type') === 'Result')
    return <TimelineItemResult result={item} intl={intl} />
  if (item.get('type') === 'Treatment')
    return <TimelineItemTreatment treatment={item} intl={intl} />
}
export default Milestones
