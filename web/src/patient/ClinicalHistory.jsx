import classnames from 'classnames/bind'
import { connect } from 'react-redux'
import React, { useRef, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import mapKeys from 'lodash/mapKeys'
import sortBy from 'lodash/sortBy'
import get from 'lodash/get'
import flowRight from 'lodash/flowRight'
import { defineMessages, injectIntl } from 'react-intl'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import ReadOnlyField from '../components/shared/ReadOnlyField'
import NavTitle from '../globals/components/NavTitle'
import DetailBackBar from '../globals/components/DetailBackBar'
import AspectTimeline from './timeline/Timeline'
import { fetchResultsByPatient } from './PatientRedux'
import Milestones from './timeline/Milestones'
import { formatDate, formatDateTime } from '../shared/utils/dateFormat'

import styles from './ClinicalHistory.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  clinicalHistory: {
    id: 'pages.ClinicalHistory.clinicalHistory',
    defaultMessage: 'Clinical History',
  },
  patient: {
    id: 'pages.ClinicalHistory.patient',
    defaultMessage: 'Patient',
  },
  patientData: {
    id: 'pages.ClinicalHistory.patientData',
    defaultMessage: 'Patient Data',
  },
})
export const ClinicalHistory = props => {
  const { intl, navigate, location, params, patientDataSchema, items, fetchResultsByPatient } = props

  const onBackClick = () => {
    navigate(-1)
  }

  const once = useRef(false)
  const [patientId, setPatientId] = useState('')
  const [timelineItems, setTimelineItems] = useState([])
  useEffect(() => {
    // componentDidMount goes in here
    // everything with this if clause will only run once
    if (once.current === false) {
      once.current = true
      setPatientId(params?.patientId || '')
      fetchResultsByPatient(params.patientId)
      // clean up after componentDidMount
      return () => {}
    }
    let i = 0
    setTimelineItems(
      items.map(item => ({
        ...item,
        date: item.get('date'),
        // eslint-disable-next-line new-cap
        details: Milestones({
          item,
          intl,
          // eslint-disable-next-line no-plusplus
          expand: i++ < 2,
        }),
      }))
    )
    // componentDidUpdate goes in here
    // everything listed here will run whenever the component was updated

    // clean up after componentDidUpdate

    return () => {}
  }, [
    fetchResultsByPatient,
    intl,
    items,
    location,
    patientId,
    // props,
    params.patientId,
  ])

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={`${intl.formatMessage(messages.patient)} ${patientId}`} />
      <NavTitle title={`${intl.formatMessage(messages.patient)} ${patientId}`} />
      <DetailBackBar onBackClick={onBackClick} title={`${intl.formatMessage(messages.patient)} ${patientId}`} />
      <section className={cssClasses('Section', 'Section--first')}>
        <Grid container spacing={16}>
          <Grid item xs={12} sm={12} md={3}>
            <Paper style={{ height: '100%' }}>
              <section style={{ padding: 20 }}>
                <p data-panel-title>{intl.formatMessage(messages.patientData)}</p>
              </section>
              <div style={{ padding: '0px 0px 20px 20px' }}>
                <Grid container>
                  {patientDataSchema &&
                    patientDataSchema.map(elem => [
                      <Grid item xs={6} s={6} md={12}>
                        <ReadOnlyField {...elem} />
                      </Grid>,
                    ])}
                </Grid>
              </div>
            </Paper>
          </Grid>
          <Grid item xs sm md container>
            <Paper style={{ width: '100%' }}>
              <AspectTimeline items={timelineItems} title={intl.formatMessage(messages.clinicalHistory)} />
            </Paper>
          </Grid>
        </Grid>
      </section>
    </div>
  )
}
const mapStateToProps = (state, ownProps) => {
  const { intl } = ownProps
  const format = type =>
    type === 'number' ? intl.formatNumber : type === 'date' ? formatDate : type === 'time' ? formatDateTime : null
  const orderSchemaProperties = patient => {
    const patientData = []
    mapKeys(patient.toJS().patientDataSchema, (value, key) => patientData.push({ ...value, key }))

    return sortBy(patientData, 'order').map(value => ({
      key: get(value, 'key'),
      label: get(value, 'title'),
      value: get(patient.toJS().patientData, get(value, 'key')),
      format: format(get(value, 'type'), intl),
    }))
  }

  return {
    items: state.patient.items,
    patientDataSchema: state.patient.items.count() > 0 ? orderSchemaProperties(state.patient.items.get(0)) : null,
    userPermissions: state.user.jwt.permissions,
  }
}

export default flowRight(injectIntl, connect(mapStateToProps, { fetchResultsByPatient }))(ClinicalHistory)
