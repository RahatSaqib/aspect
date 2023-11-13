import React from 'react'
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material'
import PropTypes from 'prop-types'
import styles from '../DailyStatus.module.css'

const DailyStatusFilters = ({ toggleAll: { checked, key, label }, statuses, action }) => {
  return (
    <div className={styles.statuses__row}>
      <div className={styles.statuses__spacer} />
      <div className={styles.statuses__container}>
        <FormGroup row>
          <div className={styles.statuses__status}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked}
                  onChange={() => action(key)}
                  value={key}
                  classes={{ root: styles[`status__checkbox__${key}`] }}
                />
              }
              label={label}
            />
          </div>
        </FormGroup>
        <FormGroup row>
          <div className={styles.statuses__status}>
            {statuses
              ? statuses.map(({ externalId, name, checked }) => (
                  <FormControlLabel
                    key={externalId}
                    classes={{
                      root: styles.statuses__statusroot,
                      label: styles.statuses__statuslabel,
                    }}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => action(externalId)}
                        value={externalId}
                        classes={{ root: styles[`status__checkbox__${externalId}`] }}
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
