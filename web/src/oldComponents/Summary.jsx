import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import PropTypes from 'prop-types'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { Unit } from './pureGrids'
import styles from './Summary.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const descriptionSection = (description, to, action) => (
  <div className={cssClasses('Summary__Description')}>
    {description}
    {to && (
      <Link to={to} className={cssClasses('Summary__Description__Link')}>
        <FaExternalLink />
      </Link>
    )}
    {action && <span className={cssClasses('Summary__Description__Action')}>{action}</span>}
  </div>
)

const Summary = ({ title, description, to, action, cols }) => (
  <Unit sm={`1-${cols}`} className={cssClasses('Summary')}>
    <div className={cssClasses('Summary__Title')}>{title}</div>
    {Array.isArray(description)
      ? description.map(item => (
          <Fragment key={item.description}>{descriptionSection(item.description, item.to, item.action)}</Fragment>
        ))
      : descriptionSection(description, to, action)}
  </Unit>
)

Summary.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  description: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Element),
    PropTypes.object,
    PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string,
        to: PropTypes.string,
        action: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      })
    ),
  ]).isRequired,
  to: PropTypes.string,
  action: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  cols: PropTypes.string,
}

Summary.defaultProps = {
  to: null,
  action: null,
  cols: '3',
}

export default enhance(Summary)
