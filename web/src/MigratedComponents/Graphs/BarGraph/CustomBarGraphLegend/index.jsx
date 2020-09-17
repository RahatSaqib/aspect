import React, { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import find from 'lodash/find'
import noop from 'lodash/noop'
import Popover from '@material-ui/core/Popover'

import LegendPopOver from './PopOver'

const cssClasses = classnames.bind(require('./CustomLegend.css'))

const LegendKey = ({ symbolShape, color, label }) => {
  return (
    <div className={cssClasses('legend__container')}>
      <div
        className={cssClasses([
          'legend__color',
          `legend__color--${symbolShape}`,
        ])}
        style={{ background: color }}
      />
      <div className={cssClasses('legend__label')}>{label}</div>
    </div>
  )
}

const CustomBarGraphLegend = ({
  keys,
  generateLegend,
  assaysFromState,
  type,
  legendsNotToRender,
  keysToRename,
  keysToPopover,
  symbolShape,
}) => {
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(false)

  useEffect(() => {
    if (anchorEl) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [anchorEl])

  console.warn(anchorEl, open)

  return (
    <div
      className={cssClasses([
        'customLegend__container',
        `customLegend__container--${type}`,
      ])}
    >
      {keys.map(k => {
        const { label, color } = generateLegend(
          k,
          assaysFromState,
          type,
          legendsNotToRender,
          keysToRename
        )

        const { externalId, message, popover } =
          find(keysToPopover, { externalId: k, popover: true }) || false

        return (
          <Fragment>
            <div
              aria-owns={popover && open ? `legend-popover-${k}` : undefined}
              aria-haspopup={popover}
              onMouseEnter={e =>
                popover ? setAnchorEl(e.currentTarget) : noop
              }
              onMouseLeave={() => setAnchorEl(false)}
              symbolShape={symbolShape}
              color={color}
              label={label}
              className={cssClasses(
                popover
                  ? ['legend__container', 'legend__container--popover']
                  : 'legend__container'
              )}
            >
              <div
                className={cssClasses([
                  'legend__color',
                  `legend__color--${symbolShape}`,
                ])}
                style={{ background: color }}
              />
              <div className={cssClasses('legend__label')}>{label}</div>
            </div>
            <Popover
              id={`legend-popover-${k}`}
              // className={classes.popover}
              // classes={{
              //   paper: classes.paper
              // }}
              open={open}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              disableRestoreFocus
            >
              message
            </Popover>

            {/* <LegendPopOver
              key={k}
              open={open}
              anchorEl={anchorEl}
              message={message}
            /> */}
          </Fragment>
        )
      })}
    </div>
  )
}

CustomBarGraphLegend.defaultProps = {
  assaysFromState: {},
  symbolShape: 'circle',
}

CustomBarGraphLegend.propTypes = {
  keys: PropTypes.oneOf([PropTypes.object]).isRequired,
  generateLegend: PropTypes.func.isRequired,
  assaysFromState: PropTypes.oneOf([PropTypes.object]),
  type: PropTypes.string.isRequired,
  symbolShape: PropTypes.string,
  legendsNotToRender: PropTypes.oneOf([PropTypes.object]).isRequired,
  keysToRename: PropTypes.oneOf([PropTypes.array]).isRequired,
  keysToPopover: PropTypes.oneOf([PropTypes.array]).isRequired,
}

export default CustomBarGraphLegend
