import React from 'react'
import classnames from 'classnames/bind'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'
import CloseIcon from '@material-ui/icons/Close'
import { mergeToFiltersParams } from '../../filter/utils'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

export default ({ assignment, showLinks, onAskConfirmation }) => {
  if (!assignment) {
    return null
  }

  const getSearch = filter => {
    const searchParams = new URLSearchParams()
    searchParams.set(
      'filters',
      mergeToFiltersParams(filter, new URLSearchParams(''))
    )
    return searchParams
  }
  const { countryId, stateId, lgaId, siteId } = assignment
  const searchCountryParams = getSearch({ countryId })
  const searchStateParams = getSearch({ countryId, stateId })
  const searchLgaParams = getSearch({ countryId, stateId, lgaId })

  return (
    <div className={cssClasses('Assignment__Section')}>
      <div className={cssClasses('Assignment__Title')}>
        {assignment.jobFunctionName}
        {onAskConfirmation && (
          <Link
            to="#"
            onClick={() => onAskConfirmation(assignment)}
            className={cssClasses('Assignment__Link')}
          >
            <CloseIcon style={{ fill: 'grey' }} />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.countryName}</span>
        {showLinks && (
          <Link
            to={`/browse/site?${searchCountryParams.toString()}`}
            className={cssClasses('Assignment__Link')}
          >
            <FaExternalLink />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.stateName || 'All states'}</span>
        {showLinks && (
          <Link
            to={`/browse/site?${searchStateParams.toString()}`}
            className={cssClasses('Assignment__Link')}
          >
            <FaExternalLink />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.lgaName || 'All LGAs'}</span>
        {showLinks && (
          <Link
            to={`/browse/site?${searchLgaParams.toString()}`}
            className={cssClasses('Assignment__Link')}
          >
            <FaExternalLink />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.siteName || 'All sites'}</span>
        {showLinks && (
          <Link
            to={
              siteId
                ? `/browse/site/${siteId}`
                : `/browse/site?${searchLgaParams.toString()}`
            }
            className={cssClasses('Assignment__Link')}
          >
            <FaExternalLink />
          </Link>
        )}
      </div>
    </div>
  )
}
