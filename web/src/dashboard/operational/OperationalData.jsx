import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'

import { Unit } from '../../components/pureGrids'
import ColumnGraph from '../../components/graph/ColumnGraph'
import DelayShowingProgressBar from '../../components/shared/DelayShowingProgressBar'
// import FiltersPanel from '../../filter/popover/FiltersPanel'
import Title from '../status/Title'
import { fetchOperationalStatus } from '../DashboardRedux'
import AbnormalBarChart from './AbnormalBarChart'
import requirePermissions from '../../components/shared/requirePermissions'
import NotFound from '../../error/notFound/NotFound'

const cssClasses = classnames.bind(require('./OperationalData.css'))

const enhance = compose(
  requirePermissions({
    features: ['operationalData:true'],
    ForbiddenComponent: NotFound,
  }),
  connect(
    state => ({
      loading: !!state.getIn(['dashboard', 'requestedAt']),
      operational: state.getIn(['dashboard', 'operational']),
    }),
    bindActionCreators.bind(null, {
      fetchOperationalStatus,
    })
  ),
  withHandlers({
    onInitialLoad: ({ location, fetchOperationalStatus }) => () => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )

      fetchOperationalStatus(filtersParams)
    },

    onAssayTypeClick: ({ history, location }) => ({
      currentTarget: { dataset: { assayType } },
    }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      filtersParams.set('assayType', assayType)
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onDateRangeClick: ({ history, location }) => ({
      currentTarget: { dataset: { dateRange } },
    }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      filtersParams.set('dateRange', dateRange)
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onDataReportClick: ({ history }) => () => history.push('/browse/report'),
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  }),
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')

    return {
      assayType: filtersParams.get('assayType') || 'all',
      dateRange: filtersParams.get('dateRange') || '30',
    }
  })
)

const themes = {
  DelayShowingProgressBar: {
    indeterminate: cssClasses('DelayShowingProgressBar--indeterminate'),
  },
}

const SectionAbnormalCollection = ({
  intl,
  title,
  colorClassName,
  collection,
  onDataReportClick,
}) => (
  <div className={cssClasses('Section')}>
    <Card className={cssClasses('Section__Content')}>
      <div className={cssClasses('TitleContainer')}>
        <Title
          className={cssClasses('TitleContainer__Title')}
          colorClassName={colorClassName}
          title={title}
        />
        <Button
          className={cssClasses('Button')}
          raised
          label="Data and reports"
          onClick={onDataReportClick}
        />
      </div>
      <div>
        {collection.map(c => (
          <AbnormalBarChart
            key={c.get('key')}
            component={Unit}
            intl={intl}
            item={c}
            sm="1-2"
            lg="1-4"
          />
        ))}
      </div>
    </Card>
  </div>
)

export const OperationalData = ({
  intl,
  // --- injected by recompose ---
  loading,
  operational,
  assayType,
  dateRange,
  onAssayTypeClick,
  onDateRangeClick,
  onDataReportClick,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title="Operational Data" />
    <div className={cssClasses('FiltersGroup')}>
      <div className={cssClasses('FiltersGroup__Child')}>
        <Button
          className={cssClasses('Button')}
          primary
          raised
          inverse={assayType !== 'all'}
          label="All diseases"
          data-assay-type="all"
          onClick={onAssayTypeClick}
        />
        <Button
          className={cssClasses('Button')}
          primary
          raised
          inverse={assayType !== 'TB'}
          label="TB"
          data-assay-type="TB"
          onClick={onAssayTypeClick}
        />
        <Button
          className={cssClasses('Button')}
          primary
          raised
          inverse={assayType !== 'HIV'}
          label="HIV"
          data-assay-type="HIV"
          onClick={onAssayTypeClick}
        />
        <Button
          className={cssClasses('Button')}
          primary
          raised
          inverse={assayType !== 'HCV'}
          label="HCV"
          data-assay-type="HCV"
          onClick={onAssayTypeClick}
        />
      </div>
      <div className={cssClasses('FiltersGroup__Child')}>
        <Button
          className={cssClasses('Button')}
          primary
          raised
          inverse={dateRange !== '30'}
          label="30 days"
          data-date-range="30"
          onClick={onDateRangeClick}
        />
        <Button
          className={cssClasses('Button')}
          primary
          raised
          inverse={dateRange !== '60'}
          label="60 days"
          data-date-range="60"
          onClick={onDateRangeClick}
        />
        {/* <Button
          className={cssClasses('Button')}
          primary
          raised
          inverse
          label="Date range"
        /> */}
      </div>
      {/* <div className={cssClasses('FiltersGroup__Child')}>
        <FiltersPanel
          history={history}
          location={location}
          intl={intl}
          config={{}}
          filters={{}}
          onChangeFilters={_.noop}
          disabled
        />
      </div> */}
    </div>
    <div className={cssClasses({ 'Content--loading': loading })}>
      <SectionAbnormalCollection
        intl={intl}
        title="Consumables"
        colorClassName={cssClasses('Title__Color--inventory')}
        collection={operational.get('inventory', [])}
        onDataReportClick={onDataReportClick}
      />
      <SectionAbnormalCollection
        intl={intl}
        title="Devices"
        colorClassName={cssClasses('Title__Color--device')}
        collection={operational.get('device', [])}
        onDataReportClick={onDataReportClick}
      />
      <div className={cssClasses('Section')}>
        <Card className={cssClasses('Section__Content')}>
          <div className={cssClasses('TitleContainer')}>
            <Title
              className={cssClasses('TitleContainer__Title')}
              colorClassName={cssClasses('Title__Color--site')}
              title="Sites"
            />
            <Button
              className={cssClasses('Button')}
              raised
              label="Data and reports"
              onClick={onDataReportClick}
            />
          </div>
          <div>
            {operational.get('site', []).map(c => (
              <Unit
                sm="1-2"
                lg="1-4"
                className={cssClasses('Graph')}
                key={c.get('key')}
              >
                <div className={cssClasses('Graph__Title')}>
                  {c.get('title')}
                </div>
                <ColumnGraph
                  data={c.get('data').toJS()}
                  color={['#e85164', '#fcb124', '#73d449']}
                  spacing={0.4}
                  hideAxes
                  rightLabel
                  hideLabel={false}
                />
              </Unit>
            ))}
          </div>
        </Card>
      </div>
      <SectionAbnormalCollection
        intl={intl}
        title="Staff"
        collection={operational.get('staff', [])}
        onDataReportClick={onDataReportClick}
      />
    </div>
    <DelayShowingProgressBar
      disabled={!loading}
      type="circular"
      mode="indeterminate"
      theme={themes.DelayShowingProgressBar}
    />
  </div>
)

export default enhance(OperationalData)
