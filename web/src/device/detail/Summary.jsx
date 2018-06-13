import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'
import { Unit } from '../../components/pureGrids'

const cssClasses = classnames.bind(require('./DeviceDetail.css'))

const enhance = _.identity

const Summary = ({ title, description, to, action }) => (
  <Unit sm="1-4" className={cssClasses('Summary')}>
    <div className={cssClasses('Summary__Title')}>{title}</div>
    <div className={cssClasses('Summary__Description')}>
      {description}
      {to && (
        <Link to={to} className={cssClasses('Summary__Description__Link')}>
          <FaExternalLink />
        </Link>
      )}
      {action && (
        <span className={cssClasses('Summary__Description__Action')}>
          {action}
        </span>
      )}
    </div>
  </Unit>
)

export default enhance(Summary)
