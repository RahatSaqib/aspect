import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'

import TaskList from '../../../../task/list/TaskList'

import styles from '../SiteDetail.css'

const cssClasses = classnames.bind(styles)

const SiteDetailAlert = ({ navigate, location, siteId }) => {
  const intl = useIntl()
  // const { siteId } = params

  return (
    <div>
      <section className={cssClasses('Section', 'Section--first')}>
        <TaskList
          intl={intl}
          navigate={navigate}
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
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  siteId: PropTypes.number.isRequired,
  // params: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default SiteDetailAlert
