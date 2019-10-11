import _ from 'lodash'
import classnames from 'classnames/bind'

import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import NavTitle from '../globals/components/NavTitle'
import DetailBackBar from '../globals/components/DetailBackBar'
import AspectTimeline from './timeline/Timeline'

const cssClasses = classnames.bind(require('./ClinicalHistory.css'))

const enhance = compose(
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    return {
      filters: _.fromPairs([...filtersParams.entries()]),
    }
  }),
  // connect(
  //   state => ({
  //     items: state.site.items,
  //     table: state.site.table,
  //     userPermissions: state.user.jwt.permissions,
  //   }),
  //   bindActionCreators.bind(null, null)
  // ),
  withHandlers({
    /*   onInitialLoad: ({
      fetchSites,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchSites(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onAlertClick: ({ history }) => event => {
      event.stopPropagation()
      const {
        currentTarget: {
          dataset: { siteId },
        },
      } = event
      history.push(`/browse/site/${siteId}/alerts`)
    },

    onExcelClick: ({
      location,
      exportSites,
      sortCol,
      sortDir,
      pageAt,
      table,
    }) => formatType => {
      const format = formatType.id
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportSites(
          filtersParams,
          sortCol,
          sortDir,
          pageAt,
          table.get('total') > 0 ? table.get('total') : 1,
          format,
          'sites'
        )
      }
    },

    onRowClick: ({ history }) => ({
      currentTarget: {
        dataset: { siteId },
      },
    }) => history.push(`/browse/site/${siteId}`), */
  })
  /* lifecycle({
    componentWillMount() { */
  /* this.setState({
        reducedFilters,
      }) */
  //  },

  // componentDidMount() {
  //   this.props.onInitialLoad()
  // },

  // componentWillReceiveProps(nextProps) {
  //   if (this.props.location.search !== nextProps.location.search) {
  //     this.props.onInitialLoad()
  //   }
  // },
  // })
)
const data = [
  {
    text: 'Wrote my first blog post ever on Medium',
    date: 'March 03 2017',
    category: {
      tag: 'medium',
      color: '#018f69',
    },
    link: {
      url:
        'https://medium.com/@popflorin1705/javascript-coding-challenge-1-6d9c712963d2',
      text: 'Read more',
    },
  },
  {
    // Another object with data
  },
]
export const ClinicalHistory = ({ history, location }) => {
  const onBackClick = () => {
    history.goBack()
  }
  const events = [
    {
      date: '12/08/1981',
      title: 'Sample 1',
      subtitle: 'Test 1',
      details: 'asdasdasdasdasdasdasdas',
    },
    {
      date: '12/08/1981',
      title: 'Sample 1',
      subtitle: 'Test 1',
      details: 'asdasdasdasdasdasdasdas',
    },
    {
      date: '12/08/1981',
      title: 'Sample 1',
      subtitle: 'Test 1',
      details: 'asdasdasdasdasdasdasdas',
    },
    {
      date: '12/08/1981',
      title: 'Sample 1',
      subtitle: 'Test 1',
      details: 'asdasdasdasdasdasdasdas',
    },
  ]
  return (
    <div className={cssClasses('Container')}>
      <Helmet title="Patient" />
      <NavTitle title="Patient" />
      <DetailBackBar
        history={history}
        location={location}
        // match={match}
        onBackClick={onBackClick}
        title="Patient 1334-12312-123"
      />

      <section className={cssClasses('Section', 'Section--first')}>
        <Grid container spacing={4} alignItems="stretch" direction="row">
          <Grid item xs={8}>
            <Paper style={{ height: '100%' }}>fecha</Paper>
          </Grid>
          <Grid item xs={4} sm container style={{ marginLeft: 10 }}>
            <Paper style={{ width: '100%' }}>
              <AspectTimeline
                items={events}
                title="Clinical History Timeline"
              />
            </Paper>
          </Grid>
        </Grid>
      </section>
    </div>
  )
}

export default enhance(ClinicalHistory)
