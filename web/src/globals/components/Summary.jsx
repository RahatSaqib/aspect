import _ from 'lodash'
import classnames from 'classnames/bind'
import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'
import { Unit } from '../../components/pureGrids'

const cssClasses = classnames.bind(require('./Summary.css'))

const enhance = _.identity

const descriptionSection = (description, to, action, landscape, title) => (
  <div className={cssClasses('Summary__Description')}>
    {landscape && <title />}
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

const Summary = ({
  title,
  description,
  to,
  action,
  cols,
  landscape = false,
}) => (
  <Unit sm={`1-${cols}`} className={cssClasses('Summary')}>
    {!landscape && <div className={cssClasses('Summary__Title')}>{title}</div>}
    {Array.isArray(description)
      ? description.map(item => (
          <Fragment key={item.description}>
            {descriptionSection(
              item.description,
              item.to,
              item.action,
              landscape,
              title
            )}
          </Fragment>
        ))
      : descriptionSection(description, to, action, landscape, title)}
  </Unit>
)

Summary.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Element),
    PropTypes.object,
    PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string,
        to: PropTypes.string,
        action: PropTypes.string,
      })
    ),
  ]).isRequired,
  to: PropTypes.string,
  action: PropTypes.string,
  cols: PropTypes.string,
  landscape: PropTypes.bool,
}

Summary.defaultProps = {
  to: null,
  action: null,
  cols: '3',
  landscape: false,
}

export default enhance(Summary)
