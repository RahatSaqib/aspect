import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'
import { Unit } from '../../components/pureGrids'

const cssClasses = classnames.bind(require('./Summary.css'))

const enhance = _.identity

const descriptionSection = (description, to, action) => (
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
)

const Summary = ({ title, description, to, action }) => (
  <Unit sm="1-3" className={cssClasses('Summary')}>
    <div className={cssClasses('Summary__Title')}>{title}</div>
    {Array.isArray(description)
      ? description.map(item =>
          descriptionSection(item.description, item.to, item.action)
        )
      : descriptionSection(description, to, action)}
  </Unit>
)

Summary.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Element),
    PropTypes.object,
  ]).isRequired,
  to: PropTypes.string,
  action: PropTypes.string,
}

Summary.defaultProps = {
  to: null,
  action: null,
}

export default enhance(Summary)
