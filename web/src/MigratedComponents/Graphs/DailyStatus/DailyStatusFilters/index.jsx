import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Checkbox from '@material-ui/core/Checkbox'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const DailyStatusFilters = ({ toggleAll, statusses, action }) => {
  return (
    <div className={cssClasses('statusses__row')}>
      <div className={cssClasses('statusses__spacer')} />
      <div className={cssClasses('statusses__container')}>
        <FormGroup row>
          <div className={cssClasses('statusses__status')}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={toggleAll.checked}
                  onChange={() => action(toggleAll.key)}
                  value={toggleAll.key}
                />
              }
              label="Toggle All"
            />
          </div>
        </FormGroup>
        <FormGroup row>
          <div className={cssClasses('statusses__status')}>
            {statusses
              ? statusses.map(({ externalId, name, checked }) => (
                  <FormControlLabel
                    classes={{
                      root: cssClasses('statusses__statusroot'),
                      label: cssClasses('statusses__statuslabel'),
                    }}
                    control={
                      <Checkbox
                        color="primary"
                        checked={checked}
                        onChange={() => action(externalId)}
                        value={externalId}
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
  statusses: PropTypes.oneOfType([PropTypes.array]).isRequired,
  action: PropTypes.func.isRequired,
}

export default DailyStatusFilters
