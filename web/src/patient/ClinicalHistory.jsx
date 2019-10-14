import classnames from 'classnames/bind'
import { connect } from 'react-redux'
import React, { useRef, useEffect, useState } from 'react'
import Helmet from 'react-helmet'
import _ from 'lodash'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'

import NavTitle from '../globals/components/NavTitle'
import DetailBackBar from '../globals/components/DetailBackBar'
import AspectTimeline from './timeline/Timeline'
import { fetchResultsByPatient } from './PatientRedux'
import Milestones from './timeline/Milestones'

const cssClasses = classnames.bind(require('./ClinicalHistory.css'))

export const ClinicalHistory = props => {
  const { intl, history, location, items, fetchResultsByPatient } = props

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
              <div className="ExpansionPanel--Label--2830PGK9">
                <h1
                  style={{
                    fontSize: '1.8rem',
                    color: '#3e8f98',
                    width: '90%',
                    maxWidth: 1200,
                    margin: '0 auto',
                    textAlign: 'center',
                    paddingTop: 40,
                    paddingBottom: 50,
                  }}
                >
                  Patient Details
                </h1>
              </div>
              <div
                className="ExpansionPanel--Detail__Content--wNTlYFfV"
                style={{ paddingRigth: 100, paddingLeft: 100 }}
              >
                <div className="DetailPanel--Field__Container--34KfOVCb">
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="City"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      City
                    </label>
                    <div
                      id="City"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      Edingeni
                    </div>
                  </div>
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="State"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      State
                    </label>
                    <div
                      id="State"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      Mzimba
                    </div>
                  </div>
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="Zip"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      Zip
                    </label>
                    <div
                      id="Zip"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      38872
                    </div>
                  </div>
                </div>
                <div className="DetailPanel--Field__Container--34KfOVCb">
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="Phone"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      Phone
                    </label>
                    <div
                      id="Phone"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      345-304-0414
                    </div>
                  </div>
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="HIV_Status"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      HIV Status
                    </label>
                    <div
                      id="HIV_Status"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      HIV Unknown
                    </div>
                  </div>
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="Age_(in years)"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      Age (in years)
                    </label>
                    <div
                      id="Age_(in years)"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      8
                    </div>
                  </div>
                </div>
                <div className="DetailPanel--Field__Container--34KfOVCb">
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="Gender"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      Gender
                    </label>
                    <div
                      id="Gender"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      Male
                    </div>
                  </div>
                  <div className="ReadOnlyField--Container--2SFi-H7_">
                    <label
                      htmlFor="Microscopy_Result"
                      className="ReadOnlyField--Container__Label--2la6CCdI"
                    >
                      Microscopy Result
                    </label>
                    <div
                      id="Microscopy_Result"
                      className="ReadOnlyField--Container__Value--33FHRX9D"
                    >
                      Smear Positive
                    </div>
                  </div>
                </div>
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
