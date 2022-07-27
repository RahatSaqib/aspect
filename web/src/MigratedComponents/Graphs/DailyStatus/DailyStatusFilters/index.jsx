import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Checkbox from '@material-ui/core/Checkbox'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import styles from '../DailyStatus.css'

const cssClasses = classnames.bind(styles)

const DailyStatusFilters = ({ toggleAll: { checked, key, label }, statuses, action }) => {
  return (
    <div className={cssClasses('statuses__row')}>
      <div className={cssClasses('statuses__spacer')} />
      <div className={cssClasses('statuses__container')}>
        <FormGroup row>
          <div className={cssClasses('statuses__status')}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked}
                  onChange={() => action(key)}
                  value={key}
                  classes={{
                    root: cssClasses(`status__checkbox--${key}`),
                  }}
                />
              }
              label={label}
            />
          </div>
        </FormGroup>
        <FormGroup row>
          <div className={cssClasses('statuses__status')}>
            {statuses
              ? statuses.map(({ externalId, name, checked }) => (
                  <FormControlLabel
                    key={externalId}
                    classes={{
                      root: cssClasses('statuses__statusroot'),
                      label: cssClasses('statuses__statuslabel'),
                    }}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => action(externalId)}
                        value={externalId}
                        classes={{
                          root: cssClasses(`status__checkbox--${externalId}`),
                        }}
                      />
                    }
                    label={name}
                  />
                ))
              : null}
          </div>
        </FormGroup>
      </div>
    </div>
  )
}

DailyStatusFilters.propTypes = {
  toggleAll: PropTypes.shape({
    checked: PropTypes.bool,
    label: PropTypes.string,
    key: PropTypes.string,
  }).isRequired,
  statuses: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]).isRequired,
  action: PropTypes.func.isRequired,
}

export default DailyStatusFilters
