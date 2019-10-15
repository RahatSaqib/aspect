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
  const {
    intl,
    history,
    location,
    patientDataSchema,
    items,
    fetchResultsByPatient,
  } = props

  const onBackClick = () => {
    history.goBack()
  }

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
    props,
    props.match.params.patientId,
  ])

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
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <h1>Patient data</h1>
                </div>
              </section>
              <div style={{ padding: '0px 0px 20px 20px' }}>
                {patientDataSchema &&
                  patientDataSchema.map(elem => [<ReadOnlyField {...elem} />])}
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
const mapStateToProps = (state, ownProps) => {
  const { intl } = ownProps
  const format = type =>
    type === 'number'
      ? intl.formatNumber
      : type === 'date'
      ? formatDate
      : type === 'time'
      ? formatDateTime
      : null
  const orderSchemaProperties = patient => {
    const patientData = []
    _.mapKeys(patient.toJS().patientDataSchema, (value, key) =>
      patientData.push({ ...value, key })
    )

    return _.sortBy(patientData, 'order').map(value => ({
      key: _.get(value, 'key'),
      label: _.get(value, 'title'),
      value: _.get(patient.toJS().patientData, _.get(value, 'key')),
      format: format(_.get(value, 'type'), intl),
    }))
  }

  return {
    items: state.patient.items,
    patientDataSchema:
      state.patient.items.count() > 0
        ? orderSchemaProperties(state.patient.items.get(0))
        : null,
    userPermissions: state.user.jwt.permissions,
  }
}

export default connect(
  mapStateToProps,
  { fetchResultsByPatient }
)(ClinicalHistory)
