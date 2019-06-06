import React from 'react'
import classnames from 'classnames/bind'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'
import CloseIcon from '@material-ui/icons/Close'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

export default ({ assignment, showLinks, onAskConfirmation }) => {
  if (!assignment) {
    return null
  }

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
      <div>{assignment.countryName}</div>
      <div>{assignment.stateName || 'All states'}</div>
      <div>{assignment.lgaName || 'All LGAs'}</div>
      <div>
        <span>{assignment.siteName || 'All sites'}</span>
        {showLinks && (
          <Link to="#" className={cssClasses('Assignment__Link')}>
            <FaExternalLink />
          </Link>
        )}
      </div>
    </div>
  )
}
