import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import TaskList from '../../../../oldPages/task/list/TaskList'

import styles from '../SiteDetail.css'
import useI18n from '../../../../hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const SiteDetailAlert = ({ navigate, location, siteId }) => {
  const intl = useI18n()
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
