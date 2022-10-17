import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import { Helmet } from 'react-helmet'
import { defineMessages } from 'react-intl'
import { useQuery } from 'react-query'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { REPORT_LIST } from '../../../components/QueryFetch/Report/index'
import useI18n from '../../../hooks/useI18n'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import { sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { useAuthState } from '../../../providers/AuthProvider'
import { showError } from '../../../store/AppNotificationRedux'
import { makeSearchParamsSanitizer, composeSanitizer } from '../../../utils/selectors/searchParams'
import { safeDownloadFile } from '../../../utils/utils/files'
import messages from './messages'
import ReportCard from './ReportCard'
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
  { consumable: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer()
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const ReportIndex = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const intl = useI18n()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const [items, setItems] = useState()
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [visibleFilters, setVisibleFilters] = useState([])
  const dispatch = useDispatch()

  const { data: { data } = false } = useQuery([REPORT_LIST.KEY, location.search], async () => {
    const { value: filtersParams } = filtersFromLocation(location)
    return fetchWrapperForQueries({
      endpoint: REPORT_LIST.ENDPOINT,
      params: { ...fromPairs([...filtersParams.entries()]) },
    })
  })
  const onClickDownload = (externalId, fileExtension = 'xlsx', reportName) => {
    const { value: filtersParams } = filtersFromLocation(location)
    const params = { ...fromPairs([...filtersParams.entries()]) }
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    if (!params.maxDate) params.maxDate = new Date()
    setShowProgressBar(true)
    return fetchWrapperForQueries({
      endpoint: `${REPORT_LIST.ENDPOINT}/${externalId}`,
      params: { ...params, format: fileExtension, timeZone },
    })
      .then(async resp => {
        setShowProgressBar(false)
        const file = await resp.blob
        safeDownloadFile(file, resp.fileName)
      })
      .catch(error => {
        setShowProgressBar(false)
        processError(error, fileExtension, reportName)
      })
  }

  const processError = (error, fileExtension, reportName) => {
    /**
     * When API endpoint responds Boom error before streaming started
     * then `error.statusCode` has some value (i.e. 4xx or 5xx) and this is
     * handled in catch block in func `handleFetchResponseOrError` in `utils/utils/fetch.js`,
     * and above catch block in onClickDownload is executing as well.
     *
     * But after Hapi started transmitting writable stream with
     * some committed data and then stream gets destroyed by some reason - then Hapi
     * can not change already transmitted headers, i.e. to set StatusCode from 200 to 5xx.
     * And destroyed on API stream with emitted error passes `then` block in `handleFetchResponseOrError`
     * (because Status Code is 200) but throws error in `then` in above `onClickDownload`
     * because response blob is having rejected Promise which throws error
     * on `await resp.blob`, and such error doesn't have prop `statusCode`.
     * So, to show error panel for such stream-related error (with response header StatusCode 200)
     * we analyze `error.statusCode` here.
     */
    if (error.statusCode === undefined) {
      const errorNotification = {
        severity: 'error',
        ...defineMessages({
          resolution: {
            id: 'errorResponseMessages.reportStream.tryAgainLater.resolution',
            defaultMessage: `Failed to generate {fileType} report "{reportName}" because of error "{errorMessage}".
            Please, try again in a few minutes. If the error persists, contact your administrator for support.
            `,
          },
          // this is same `title` as in `default` in `components/QueryFetch/errors.js`
          title: {
            id: 'queryFetch.errorResponseMessages.GET.default.title',
            defaultMessage: 'Error Fetching Endpoint',
          },
        }),
      }
      const messageValues = {
        reportName,
        errorMessage: error.message,
        fileType: fileExtension === 'xlsx' ? 'Excel' : fileExtension,
      }
      dispatch(showError(errorNotification, messageValues))
    }
  }

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
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
     * AuthProvider does `user.toJS()` in `web/src/providers/AuthProvider/index.jsx`
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
      <DataTableProgressBar disabled={!showProgressBar} />
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
        {items?.map(({ externalId, name, description, i18nKey, i18nKeyDescription, exportExcel, exportCsv }) => (
          <ReportCard
            title={name}
            description={description}
            i18nKey={i18nKey}
            i18nKeyDescription={i18nKeyDescription}
            exportExcel={exportExcel}
            exportCsv={exportCsv}
            key={externalId}
            onClick={(fileExtension, reportName) => onClickDownload(externalId, fileExtension, reportName)}
            navigate={navigate}
          />
        ))}
      </Grid>
    </div>
  )
}
export default ReportIndex
