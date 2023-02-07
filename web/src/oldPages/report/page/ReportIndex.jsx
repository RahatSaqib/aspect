import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { defineMessages } from 'react-intl'
import { useQuery } from 'react-query'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import DetailHeader from '../../../components/DetailHeader'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { REPORT_LIST } from '../../../components/QueryFetch/Report/index'
import useI18n from '../../../hooks/useI18n'
import messages from '../../../messages/report'
import BrowseFilters from '../../../oldComponents/filter/BrowseFilters'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { useAuthState } from '../../../providers/AuthProvider'
import { showError } from '../../../store/AppNotificationRedux'
import { makeSearchParamsSanitizer } from '../../../utils/selectors/searchParams'
import { safeDownloadFile } from '../../../utils/utils/files'
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
  { assayId: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer()
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)

const ReportIndex = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const intl = useI18n()
  const { userPermissions } = useAuthState()
  const [items, setItems] = useState()
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [filters, setFilters] = useState([])
  const dispatch = useDispatch()

  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const params = { ...filters }

  const { data: { data } = false } = useQuery([REPORT_LIST.KEY, { params }], async () => {
    return fetchWrapperForQueries({
      endpoint: REPORT_LIST.ENDPOINT,
      params,
    })
  })
  const onClickDownload = (externalId, fileExtension = 'xlsx', reportName) => {
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
      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }

    setFilters(getFilters(filtersParams))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  useEffect(() => {
    if (data) {
      setItems(data)
    }
  }, [data])

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.reportsTitle)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.reportsTitle)} />
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
          <BrowseFilters navigate={navigate} location={location} config={reducedFilters} showBrowseDropdown={false} />
        </div>
        <DataTableProgressBar disabled={!showProgressBar} />
        <Grid container spacing={16} sx={{ width: 'auto', margin: 0 }}>
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
    </>
  )
}
export default ReportIndex
