import React from 'react'
import CloseIcon from '@mui/icons-material/RemoveCircle'
import classnames from 'classnames/bind'
import camelCase from 'lodash/camelCase'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import useI18n from '../../../hooks/useI18n'
import { mergeToFiltersParams } from '../../../oldComponents/utils'
import messages from './messages'
import styles from './PersonDetail.css'

const cssClasses = classnames.bind(styles)

export default ({ assignment, showLinks, onAskConfirmation }) => {
  if (!assignment) {
    return null
  }

  const getSearch = filter => {
    const searchParams = new URLSearchParams()
    searchParams.set('filters', mergeToFiltersParams(filter, new URLSearchParams('')))
    return searchParams
  }
  const { countryId, stateId, lgaId, siteId } = assignment
  const searchCountryParams = getSearch({ countryId })
  const searchStateParams = getSearch({ countryId, stateId })
  const searchLgaParams = getSearch({ countryId, stateId, lgaId })
  const { formatMessage } = useI18n()

  const textForAssignmentItem = (i18nKey, name) => {
    return (messages[i18nKey] ? formatMessage(messages[i18nKey]) : name) || name
  }
  return (
    <div className={cssClasses('Assignment__Section')}>
      <div className={cssClasses('Assignment__Title')}>
        {formatMessage(messages[camelCase(assignment.jobFunctionName)])}

        {onAskConfirmation && (
          <Link to="#" onClick={() => onAskConfirmation(assignment)} className={cssClasses('Assignment__Link')}>
            <CloseIcon style={{ fill: '--aspect-color-chill-blue-1' }} />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.countryName}</span>
        {showLinks && (
          <Link to={`/browse/site?${searchCountryParams.toString()}`} className={cssClasses('Assignment__Link')}>
            <FaExternalLink />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.stateName || formatMessage(messages.allStates)}</span>
        {showLinks && (
          <Link to={`/browse/site?${searchStateParams.toString()}`} className={cssClasses('Assignment__Link')}>
            <FaExternalLink />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.lgaName || formatMessage(messages.allAreas)}</span>
        {showLinks && (
          <Link to={`/browse/site?${searchLgaParams.toString()}`} className={cssClasses('Assignment__Link')}>
            <FaExternalLink />
          </Link>
        )}
      </div>
      <div>
        <span>{assignment.siteName || formatMessage(messages.allSites)}</span>
        {showLinks && (
          <Link
            to={siteId ? `/browse/site/${siteId}` : `/browse/site?${searchLgaParams.toString()}`}
            className={cssClasses('Assignment__Link')}
          >
            <FaExternalLink />
          </Link>
        )}
      </div>
      <div>
        {assignment.diseaseName && <strong>{formatMessage(messages.disease)}&nbsp;</strong>}
        <span>
          {textForAssignmentItem(assignment.diseasei18nKey, assignment.diseaseName) ||
            formatMessage(messages.allDiseases)}
        </span>
      </div>
      <div>
        {assignment.deviceTypeName && <strong>{formatMessage(messages.deviceType)}&nbsp;</strong>}
        <span>{assignment.deviceTypeName || formatMessage(messages.allDeviceTypes)}</span>
      </div>
      <div>
        {assignment.assayTypeName && <strong>{formatMessage(messages.assayType)}&nbsp;</strong>}
        <span>
          {textForAssignmentItem(assignment.assayTypei18nKey, assignment.assayTypeName) ||
            formatMessage(messages.allAssayTypes)}
        </span>
      </div>
      <div>
        {assignment.assayName && <strong>{formatMessage(messages.assay)}&nbsp;</strong>}
        <span>
          {textForAssignmentItem(assignment.assayi18nKey, assignment.assayName) || formatMessage(messages.allAssays)}
        </span>
      </div>
    </div>
  )
}
