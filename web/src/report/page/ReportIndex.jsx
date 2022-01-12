import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import React, { useState, useEffect } from 'react'

import { useIntl } from 'react-intl'
import { Helmet } from 'react-helmet'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
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
import messages from './messages'

import styles from './ReportIndex.css'

const cssClasses = classnames.bind(styles)

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
  const navigate = useNavigate()
  const location = useLocation()
  const intl = useIntl()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const [items, setItems] = useState()
  const [visibleFilters, setVisibleFilters] = useState([])

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
    const { value: filtersParams } = filtersFromLocation(location)
    const params = { ...fromPairs([...filtersParams.entries()]) }
    params.format = fileExtension
    if (!params.maxDate) params.maxDate = new Date()
    return fetchWrapperForQueries({
      endpoint: `${REPORT_LIST.ENDPOINT}/${externalId}`,
      params,
    }).then(async resp => {
      const file = await resp.blob
      safeDownloadFile(file, resp.fileName)
    })
  }
  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const { sanitized: filtersSanitized, value: filtersParams } =
      filtersSanitizer(searchParams.get('filters') || '')
    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)

      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }
    const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)

    setVisibleFilters(fromPairs([...Object.entries(reducedFilters)]))

    /**
     * Do not include `userPermissions` into dependency array below.
     * Because `userPermissions` has new reference on every rendering cycle because
     * AuthProvider does `user.toJS()` in `web/src/Providers/AuthProvider/index.jsx`
     * TODO: change it in AuthProvider and use only `user` object
     * like  `useSelector(({ user }) => user)` there. After change - remove
     * this comment and add `userPermissions` into dependency array below.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate])

  useEffect(() => {
    if (data) {
      setItems(data)
    }
  }, [data])

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.reportsTitle)} />
      <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
      {visibleFilters && (
        <BrowseFilters
          navigate={navigate}
          location={location}
          intl={intl}
          config={visibleFilters}
          showBrowseDropdown={false}
        />
      )}
      <Grid
        container
        spacing={16}
        sx={{
          width: 'auto',
          margin: 0,
        }}
      >
        {items?.map(
          ({ externalId, name, description, i18nKey, i18nKeyDescription }) => (
            <ReportCard
              title={name}
              description={description}
              i18nKey={i18nKey}
              i18nKeyDescription={i18nKeyDescription}
              key={externalId}
              onClick={fileExtension =>
                onClickDownload(externalId, fileExtension)
              }
              navigate={navigate}
            />
          )
        )}
      </Grid>
    </div>
  )
}
export default ReportIndex
