import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import React, { useState, useEffect } from 'react'

import { defineMessages, useIntl } from 'react-intl'
import { Helmet } from 'react-helmet'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import { useHistory, useLocation } from 'react-router-dom'
import { safeDownloadFile } from '../../shared/utils/files'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import REPORT_LIST from '../../MigratedComponents/QueryFetch/Report/index'
import {
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import ReportCard from './ReportCard'
import { useAuthState } from '../../Providers/AuthProvider'

const cssClasses = classnames.bind(require('./ReportIndex.css'))

const messages = defineMessages({
  reportsTitle: {
    id: 'pages.ReportIndex.title',
    defaultMessage: 'Reports',
  },
})

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view'],
  },
  { date: true, requiredPermissions: [] },
  { reportName: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer()
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const ReportIndex = () => {
  const history = useHistory()
  const location = useLocation()
  const intl = useIntl()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const [items, setItems] = useState()
  const [filters, setFilters] = useState([])

  const { data: { data } = false } = useQuery(
    [REPORT_LIST.KEY, location.search],
    async () => {
      const { value: filtersParams } = filtersFromLocation(location)
      return fetchWrapperForQueries({
        endpoint: REPORT_LIST.ENDPOINT,
        params: { ...fromPairs([...filtersParams.entries()]) },
      })
    }
  )
  const onClickDownload = (externalId, fileExtension = 'xlsx') => {
    setFilters({ ...filters, format: fileExtension })
    filtersFromLocation.format = fileExtension
    if (!filtersFromLocation.maxDate) filtersFromLocation.maxDate = new Date()
    return fetchWrapperForQueries({
      endpoint: `${REPORT_LIST.ENDPOINT}/${externalId}`,
      params: { ...filtersFromLocation },
    }).then(async resp => {
      const file = await resp.blob
      safeDownloadFile(file, resp.fileName)
    })
  }
  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const {
      sanitized: filtersSanitized,
      value: filtersParams,
    } = filtersSanitizer(searchParams.get('filters') || '')
    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    }
    const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
    setFilters(fromPairs([...Object.entries(reducedFilters)]))
  }, [history, location, userPermissions])

  useEffect(() => {
    if (data) {
      setItems(data)
    }
  }, [data])

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.reportsTitle)} />
      <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
      {filters && (
        <BrowseFilters
          history={history}
          location={location}
          intl={intl}
          config={filters}
          showBrowseDropdown={false}
        />
      )}
      <Grid container spacing={16}>
        {items?.map(({ externalId, name, description }) => (
          <ReportCard
            title={name}
            description={description}
            onClick={fileExtension =>
              onClickDownload(externalId, fileExtension)
            }
            history={history}
          />
        ))}
      </Grid>
    </div>
  )
}
export default ReportIndex
