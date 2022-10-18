import React, { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import classnames from 'classnames/bind'
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import { defineMessages } from 'react-intl'
import { Link } from 'react-router-dom'
import styles from './Milestones.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  sampleId: {
    id: 'pages.MilestonesSample.sampleId',
    defaultMessage: 'Sample ',
  },
  originalSiteName: {
    id: 'pages.Milestones.originalSiteName',
    defaultMessage: 'Sample Collection Site: ',
  },
  sampleCollectedOn: {
    id: 'pages.Milestones.sampleCollectedOn',
    defaultMessage: 'Collected On: ',
  },
  sampleType: {
    id: 'pages.Milestones.sampleType',
    defaultMessage: 'Sample Type: ',
  },
  notes: {
    id: 'pages.Milestones.notes',
    defaultMessage: 'Description: ',
  },
  result: {
    id: 'pages.Milestones.resultNotes',
    defaultMessage: 'Result ',
  },
  resultEndedOn: {
    id: 'pages.Milestones.resultEndedOn',
    defaultMessage: 'Result ended on: ',
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
  },
  date: {
    id: 'pages.Milestones.date',
    defaultMessage: 'Date ',
  },
  followUpName: {
    id: 'pages.Milestones.followUpName',
    defaultMessage: 'Outcome ',
  },
  followUpTypeName: {
    id: 'pages.Milestones.followUpTypeName',
    defaultMessage: 'Outcome type: ',
  },
  followUpCreatedOn: {
    id: 'pages.Milestones.followUpCreatedOn',
    defaultMessage: 'Created On: ',
  },
  resultTreatmentStatusLogDate: {
    id: 'pages.Milestones.resultTreatmentStatusLogData',
    defaultMessage: 'Treatment date: ',
  },
  resultTreatmentStatusLogMethod: {
    id: 'pages.Milestones.resultTreatmentStatusLogMethod',
    defaultMessage: 'Treatment method: ',
  },
  resultTreatmentStatusLogCreatedBy: {
    id: 'pages.Milestones.resultTreatmentStatusLogCreatedBy',
    defaultMessage: 'Treatment created by: ',
  },
  resultTreatmentName: {
    id: 'pages.Milestones.resultTreatmentName',
    defaultMessage: 'Treatment',
  },
})

const TimelineGenericPatientMilestone = ({ title, details, link, expand, color }) => {
  const [expanded, setExpanded] = useState(expand)
  return (
    <Accordion
      onChange={(event, expandparam) => setExpanded(expandparam)}
      style={{
        width: '100%',
        display: 'table',
        backgroundColor: color,
      }}
      expanded={expanded}
    >
      <AccordionSummary expandIcon={expanded ? <span>-</span> : <span>+</span>}>
        <div style={{ width: '100%' }}>
          <div className={cssClasses('Summary__Title')}>{title.key}</div>
          <div className={cssClasses('Summary__Description')} style={{ bottom: 0 }}>
            {title.value}
          </div>
        </div>
      </AccordionSummary>
      <AccordionDetails style={{ display: 'table' }}>
        <div style={{ width: '100%' }}>
          <ul>
            {details &&
              details.map(item => (
                <li>
                  <span className={cssClasses('Summary__Title')}>{item.key}</span>
                  <span className={cssClasses('Summary__Description')}>{item.value}</span>
                </li>
              ))}
          </ul>
        </div>
      </AccordionDetails>
      {link && (
        <AccordionActions style={{ width: '100%', marginRight: 10 }}>
          <Link to={link.to} className={cssClasses('Summary__Description__Link')}>
            {link.text}
          </Link>
        </AccordionActions>
      )}
    </Accordion>
  )
}

const TimelineItemResult = ({ result, intl, expand }) => {
  const detailsFields = [
    {
      key: intl.formatMessage(messages.resultSiteName),
      value: result.get('resultSiteName'),
    },
    {
      key: intl.formatMessage(messages.assayType),
      value: result.get('assayAbbreviation'),
    },
    {
      key: intl.formatMessage(messages.resultEndedOn),
      value: format(parseISO(result.get('resultEndedOn')), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: intl.formatMessage(messages.notes),
      value: result.get('resultNotes'),
    },
    {
      key: intl.formatMessage(messages.sampleId),
      value: result.get('sampleId'),
    },
  ]
  return (
    <TimelineGenericPatientMilestone
      title={{
        key: intl.formatMessage(messages.result),
        value: result.get('description'),
      }}
      details={detailsFields}
      link={{
        to: `/browse/result/${result.get('resultId')}`,
        text: intl.formatMessage(messages.viewResultsDetails),
      }}
      expand={expand}
      color="#c2f9e3"
    />
  )
}

const TimelineItemFollowUp = ({ fu, intl, expand }) => {
  const detailsFields = [
    {
      key: intl.formatMessage(messages.date),
      value: format(parseISO(fu.get('date')), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: intl.formatMessage(messages.followUpTypeName),
      value: fu.get('followUpTypeName'),
    },
    {
      key: intl.formatMessage(messages.followUpCreatedOn),
      value: fu.get('followUpCreatedOn'),
    },
  ]
  return (
    <TimelineGenericPatientMilestone
      title={{
        key: intl.formatMessage(messages.followUpName),
        value: fu.get('followUpName'),
      }}
      details={detailsFields}
      expand={expand}
      color="#DFD2E6"
    />
  )
}
const TimelineItemSample = ({ sample, intl, expand }) => {
  const detailsFields = [
    {
      key: intl.formatMessage(messages.originalSiteName),
      value: sample.get('originalSiteName'),
    },
    {
      key: intl.formatMessage(messages.sampleCollectedOn),
      value: format(parseISO(sample.get('sampleCollectedOn')), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: intl.formatMessage(messages.sampleType),
      value: sample.get('sampleType'),
    },
    {
      key: intl.formatMessage(messages.notes),
      value: sample.get('description'),
    },
  ]
  return (
    <TimelineGenericPatientMilestone
      title={{
        key: intl.formatMessage(messages.sampleId),
        value: sample.get('sampleId'),
      }}
      details={detailsFields}
      expand={expand}
      color="#efe5d3"
    />
  )
}

const TimelineItemTreatment = ({ treatment, intl, expand }) => {
  const detailsFields = [
    {
      key: intl.formatMessage(messages.resultTreatmentStatusLogDate),
      value: format(parseISO(treatment.get('followUpCreatedOn')), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: intl.formatMessage(messages.date),
      value: format(parseISO(treatment.get('date')), 'yyyy-MM-dd HH:mm:ss'),
    },
  ]
  return (
    <TimelineGenericPatientMilestone
      title={{
        key: intl.formatMessage(messages.resultTreatmentName),
        value: treatment.get('followUpName'),
      }}
      details={detailsFields}
      expand={expand}
      color="#c4ddfa"
    />
  )
}
const Milestones = ({ item, intl, expand }) => {
  if (item.get('type') === 'Sample') return <TimelineItemSample sample={item} intl={intl} expand={expand} />
  if (item.get('type') === 'Result') return <TimelineItemResult result={item} intl={intl} expand={expand} />
  if (item.get('type') === 'Treatment') return <TimelineItemTreatment treatment={item} intl={intl} expand={expand} />
  if (item.get('type') === 'Outcome') return <TimelineItemFollowUp fu={item} intl={intl} expand={expand} />
}
export default Milestones
