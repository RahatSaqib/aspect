import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'

import TaskList from '../../../../task/list/TaskList'

const cssClasses = classnames.bind(require('../SiteDetail.css'))

const SiteDetailAlert = ({ history, location, match }) => {
  const intl = useIntl()
  const { siteId } = match.params

  return (
    <div>
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
  history: PropTypes.oneOfType([PropTypes.object]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default SiteDetailAlert
