import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import React, { useState, useEffect } from 'react'

import { defineMessages, useIntl } from 'react-intl'
import { useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import { useHistory, useLocation } from 'react-router-dom'
import Immutable from 'immutable'
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
  const userPermissions = useSelector(state => state.user.jwt.permissions)
  const [items, setItems] = useState()
  const [filters, setFilters] = useState()
  // const { sanitized, value: filtersParams } = filtersFromLocation(location)
  const { data, isError, error } = useQuery(REPORT_LIST.KEY, async () =>
    fetchWrapperForQueries({
      endpoint: REPORT_LIST.ENDPOINT,
    })
  )
  if (isError) {
    console.log('error', error)
  }
  const onClickDownload = (externalId, fileExtension = 'xlsx') => {
    if (!false) {
      filters.set('format', fileExtension)
      return fetchWrapperForQueries({
        endpoint: `${REPORT_LIST.ENDPOINT}/${externalId}`,
        params: { ...filters },
      })
    }
  }
  /*
  useEffect(() => {
    console.log('use effect')
    console.log(data, error, status)
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

    setFilters(fromPairs([...reducedFilters.entries()]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])
*/
  // >>>>>> Lifecycles <<<<<<
  useEffect(() => {
    console.log('data', data)
    if (data) {
      setItems(data.data)
      // setItems(Immutable.fromJS(data))
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // const props = {
  //   items: Immutable.fromJS(data),
  //   intl,
  //   history,
  //   location,
  //   reducedFilters: filters,
  //   // onClickDownload,
  // }

  console.log(items)

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
      <Grid container>
        {items && items.length
          ? items.map(({ externalId, name, description }) => {
              return (
                <ReportCard
                  title={name}
                  description={description}
                  onClick={fileExtension =>
                    onClickDownload(externalId, fileExtension)
                  }
                  history={history}
                />
              )
            })
          : null}
      </Grid>
    </div>
  )
}

// const ReportList = ({
//   intl,
//   history,
//   location,
//   items,
//   reducedFilters,
//   onClickDownload,
// }) => {
//   console.log(items)
//   return (
//     <div className={cssClasses('Container')}>
//       <Helmet title={intl.formatMessage(messages.reportsTitle)} />
//       <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
//       {reducedFilters && (
//         <BrowseFilters
//           history={history}
//           location={location}
//           intl={intl}
//           config={reducedFilters}
//           showBrowseDropdown={false}
//         />
//       )}
//       <Grid container>
//         reports
//         {/* {items &&
//           items.map(report => {
//             const externalId = report.get('externalId')
//             return (
//               <ReportCard
//                 title={report.get('name')}
//                 description={report.get('description')}
//                 onClick={fileExtension =>
//                   onClickDownload(externalId, fileExtension)
//                 }
//                 history={history}
//               />
//             )
//     }
//           })} */}
//       </Grid>
//     </div>
//   )
// }

export default ReportIndex
