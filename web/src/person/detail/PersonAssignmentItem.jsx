import React from 'react'
import classnames from 'classnames/bind'
import { Link } from 'react-router-dom'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import CloseIcon from '@material-ui/icons/RemoveCircle'
import { mergeToFiltersParams } from '../../filter/utils'
import messages from './messages'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

export default ({ assignment, showLinks, onAskConfirmation, intl }) => {
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
            <CloseIcon style={{ fill: '--aspect-color-chill-blue-1' }} />
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
        <span>
          {assignment.stateName || intl.formatMessage(messages.allStates)}
        </span>
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
        <span>
          {assignment.lgaName || intl.formatMessage(messages.allAreas)}
        </span>
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
        <span>
          {assignment.siteName || intl.formatMessage(messages.allSites)}
        </span>
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
      <div>
        <span>
          {assignment.diseaseName || intl.formatMessage(messages.allDiseases)}
        </span>
      </div>
      <div>
        <span>
          {assignment.deviceTypeName ||
            intl.formatMessage(messages.allDeviceTypes)}
        </span>
      </div>
      <div>
        <span>
          {assignment.assayTypeName ||
            intl.formatMessage(messages.allAssayTypes)}
        </span>
      </div>
      <div>
        <span>
          {assignment.assayName || intl.formatMessage(messages.allAssays)}
        </span>
      </div>
    </div>
  )
}
