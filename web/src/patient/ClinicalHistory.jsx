import _ from 'lodash'
import classnames from 'classnames/bind'
import Card from '@material-ui/core/Card'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import NavTitle from '../globals/components/NavTitle'
import BrowseFilters from '../globals/components/BrowseFilters'

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

export const ClinicalHistory = ({
  intl,
  history,
  location,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title="Patient" />
    <NavTitle title="Patient" />

    <Card>nicolas es agradable</Card>
  </div>
)

export default enhance(ClinicalHistory)
