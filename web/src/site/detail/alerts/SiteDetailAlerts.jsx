import React from 'react'
import classnames from 'classnames/bind'
import Card from '@material-ui/core/Card'
import SiteDetailBackBar from '../SiteDetailBackBar'

const cssClasses = classnames.bind(require('../SiteDetail.css'))

const SiteDetailAlert = ({
  history,
  location,
  match,
  disabled,
  site,
  formatMessage,
}) => (
  <div>
    {site && (
      <SiteDetailBackBar
        formatMessage={formatMessage}
        history={history}
        location={location}
        match={match}
        title={site.get('name')}
        disabled={disabled}
      />
    )}
    <section className={cssClasses('Section', 'Section--first')}>
      <Card className={cssClasses('Section__Content')}>I am the alerts</Card>
    </section>
  </div>
)

export default SiteDetailAlert
