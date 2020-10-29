import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'

import SiteDetailBackBar from '../SiteDetailBackBar'
import TaskList from '../../../task/list/TaskList'

const cssClasses = classnames.bind(require('../SiteDetail.css'))

const SiteDetailAlert = ({ history, location, match, disabled, site }) => {
  const intl = useIntl()
  const { siteId } = match.params

  return (
    <div>
      {site && (
        <SiteDetailBackBar
          formatMessage={intl.formatMessage}
          history={history}
          location={location}
          match={match}
          title={site.get('name')}
          disabled={disabled}
        />
      )}
      <section className={cssClasses('Section', 'Section--first')}>
        <TaskList
          intl={intl}
          history={history}
          location={location}
          filterOptions={{
            siteId,
          }}
        />
      </section>
    </div>
  )
}

SiteDetailAlert.propTypes = {
  history: PropTypes.oneOf([PropTypes.object]).isRequired,
  location: PropTypes.oneOf([PropTypes.object]).isRequired,
  match: PropTypes.oneOf([PropTypes.object]).isRequired,
  disabled: PropTypes.bool.isRequired,
  site: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default SiteDetailAlert
