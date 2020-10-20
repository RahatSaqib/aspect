import React from 'react'
import classnames from 'classnames/bind'
import SiteDetailBackBar from '../SiteDetailBackBar'
import TaskList from '../../../../task/list/TaskList'

const cssClasses = classnames.bind(require('../SiteDetail.css'))

const SiteDetailAlert = props => {
  const { history, location, match, disabled, site, intl } = props
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

export default SiteDetailAlert
