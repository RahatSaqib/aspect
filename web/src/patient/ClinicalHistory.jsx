import classnames from 'classnames/bind'
import { connect } from 'react-redux'
import React, { useRef, useEffect, useState } from 'react'
import Helmet from 'react-helmet'
import _ from 'lodash'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import ReadOnlyField from '../components/shared/ReadOnlyField'
import NavTitle from '../globals/components/NavTitle'
import DetailBackBar from '../globals/components/DetailBackBar'
import AspectTimeline from './timeline/Timeline'
import { fetchResultsByPatient } from './PatientRedux'
import Milestones from './timeline/Milestones'
import { formatDate, formatDateTime } from '../shared/utils/dateFormat'

const cssClasses = classnames.bind(require('./ClinicalHistory.css'))

export const ClinicalHistory = props => {
  const { intl, history, location, items, fetchResultsByPatient } = props

  const onBackClick = () => {
    history.goBack()
  }
  const format = (type, intl) =>
    type === 'number'
      ? intl.formatNumber
      : type === 'date'
      ? formatDate
      : type === 'time'
      ? formatDateTime
      : null

  const once = useRef(false)
  const [patientId, setPatientId] = useState('')
  const [timelineItems, setTimelineItems] = useState([])
  useEffect(() => {
    // componentDidMount goes in here
    // everything with this if clause will only run once
    if (once.current === false) {
      once.current = true
      setPatientId(props.match.params.patientId)
      fetchResultsByPatient(props.match.params.patientId)
      // clean up after componentDidMount
      return () => {}
    }

    setTimelineItems(
      _.map(items, item => ({
        ...item,
        // eslint-disable-next-line new-cap
        details: Milestones({
          item,
          intl,
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
    props,
    props.match.params.patientId,
  ])
  const patient = items.length > 0 ? items[0] : null

  const patientData = []
  let rawPatientData
  if (patient) {
    _.mapKeys(patient.patientDataSchema, (value, key) =>
      patientData.push({ ...value, key })
    )

    rawPatientData = _.sortBy(patientData, 'order').map(value => ({
      key: _.get(value, 'key'),
      label: _.get(value, 'title'),
      value: _.get(patient.patientData, _.get(value, 'key')),
      format: format(_.get(value, 'type'), intl),
      data: patient,
    }))
  }

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={`Patient ${patientId}`} />
      <NavTitle title={`Patient ${patientId}`} />
      <DetailBackBar
        history={history}
        location={location}
        onBackClick={onBackClick}
        title={`Patient ${patientId}`}
      />

      <section className={cssClasses('Section', 'Section--first')}>
        <Grid container spacing={4} alignItems="stretch" direction="row">
          <Grid item xs={4}>
            <Paper style={{ height: '100%' }}>
              <section style={{ padding: 20 }}>
                <div>
                  <h1>Patient data</h1>
                </div>
              </section>
              <div style={{ padding: '0px 20px 20px 20px' }}>
                {rawPatientData &&
                  rawPatientData.map(elem => [<ReadOnlyField {...elem} />])}
              </div>
            </Paper>
          </Grid>
          <Grid item xs={8} sm container style={{ marginLeft: 10 }}>
            <Paper style={{ width: '100%' }}>
              <AspectTimeline
                items={timelineItems}
                title="Clinical History Timeline"
              />
            </Paper>
          </Grid>
        </Grid>
      </section>
    </div>
  )
}
const mapStateToProps = state => ({
  items: state.patient.items.toJS(),
  userPermissions: state.user.jwt.permissions,
})

export default connect(
  mapStateToProps,
  { fetchResultsByPatient }
)(ClinicalHistory)
