import classnames from 'classnames/bind'
import React, { useCallback, useEffect, useState } from 'react'
import _ from 'lodash'
import { connect, useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet'
import Card from '@material-ui/core/Card'
import { injectIntl } from 'react-intl'

import { Unit } from '../../components/pureGrids'
import { DelayShowingProgressCircular } from '../../components/shared/DelayShowingProgressBar'
import AspectButton from '../../components/shared/AspectButton'
import Title from '../status/Title'
import { fetchOperationalStatus } from '../DashboardRedux'
import AbnormalBarChart from './AbnormalBarChart'

const cssClasses = classnames.bind(require('./OperationalData.css'))

const getSearchFilterParams = locationSearch => {
  const searchParams = new URLSearchParams(locationSearch)
  const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
  return {
    searchParams,
    filtersParams,
  }
}
const getPropsFromQueryString = locationSearch => {
  const { filtersParams } = getSearchFilterParams(locationSearch)
  return {
    locationSearch,
    assayType: filtersParams.get('assayType') || 'all',
    dateRange: filtersParams.get('dateRange') || '30',
  }
}

// HOC for adding few props from queryString filters
const injectFilterParams = WrappedComponent => props => {
  const { fetchOperationalStatus, history, location } = props
  const dispatch = useDispatch()
  const [state, setState] = useState(getPropsFromQueryString(location.search))
  const loadData = useCallback(() => {
    const { filtersParams } = getSearchFilterParams(location.search)
    // TODO - uncomment below line when endpoints are ready
    // dispatch(fetchOperationalStatus(filtersParams))
  }, [location])

  // load data on first render
  useEffect(() => loadData(), [loadData])
  // reload data if filter changed in the location
  useEffect(() => {
    if (state.locationSearch !== location.search) {
      setState(getPropsFromQueryString(location.search))
      loadData()
    }
  }, [loadData, location, state.locationSearch])

  const historyReplace = useCallback(
    (name, value) => {
      const { filtersParams, searchParams } = getSearchFilterParams(
        location.search
      )
      filtersParams.set(name, value)
      searchParams.set('filters', filtersParams)
      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
    [history, location]
  )

  const onAssayTypeClick = useCallback(
    ({
      currentTarget: {
        dataset: { assayType },
      },
    }) => historyReplace('assayType', assayType),
    [historyReplace]
  )

  const onDateRangeClick = useCallback(
    ({
      currentTarget: {
        dataset: { dateRange },
      },
    }) => historyReplace('dateRange', dateRange),
    [historyReplace]
  )

  const onDataReportClick = useCallback(() => history.push('/browse/report'), [
    history,
  ])

  const allProps = {
    ...props,
    assayType: state.assayType,
    dateRange: state.dateRange,
    onAssayTypeClick,
    onDateRangeClick,
    onDataReportClick,
  }

  return <WrappedComponent {...allProps} />
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
        <AspectButton
          className={cssClasses('Button')}
          variant="contained"
          onClick={onDataReportClick}
        >
          Data and reports
        </AspectButton>
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
        <AspectButton
          className={cssClasses('Button')}
          color="primary"
          variant="contained"
          inverse={assayType !== 'all'}
          data-assay-type="all"
          onClick={onAssayTypeClick}
        >
          All diseases
        </AspectButton>

        <AspectButton
          className={cssClasses('Button')}
          color="primary"
          variant="contained"
          inverse={assayType !== 'TB'}
          data-assay-type="TB"
          onClick={onAssayTypeClick}
        >
          TB
        </AspectButton>
        <AspectButton
          className={cssClasses('Button')}
          color="primary"
          variant="contained"
          inverse={assayType !== 'HIV'}
          data-assay-type="HIV"
          onClick={onAssayTypeClick}
        >
          HIV
        </AspectButton>
        <AspectButton
          className={cssClasses('Button')}
          color="primary"
          variant="contained"
          inverse={assayType !== 'HCV'}
          data-assay-type="HCV"
          onClick={onAssayTypeClick}
        >
          HCV
        </AspectButton>
      </div>
      <div className={cssClasses('FiltersGroup__Child')}>
        <AspectButton
          className={cssClasses('Button')}
          color="primary"
          variant="contained"
          inverse={dateRange !== '30'}
          data-date-range="30"
          onClick={onDateRangeClick}
        >
          30 days
        </AspectButton>
        <AspectButton
          className={cssClasses('Button')}
          color="primary"
          variant="contained"
          inverse={dateRange !== '60'}
          data-date-range="60"
          onClick={onDateRangeClick}
        >
          60 days
        </AspectButton>
      </div>
    </div>
    <div className={cssClasses({ 'Content--loading': loading })} />
    <DelayShowingProgressCircular
      disabled={!loading}
      variant="indeterminate"
      className={cssClasses('DelayShowingProgressCircular--indeterminate')}
    />
  </div>
)

export default _.flowRight(
  injectIntl,
  connect(
    state => ({
      loading: !!state.getIn(['dashboard', 'requestedAt']),
      operational: state.getIn(['dashboard', 'operational']),
    }),
    {
      fetchOperationalStatus,
    }
  ),
  injectFilterParams
)(OperationalData)
