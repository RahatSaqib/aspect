import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import styles from './Shell.css'

const cssClasses = classnames.bind(styles)

const ShellHeader = ({ children, icon: Icon, title, className }) => (
  <div
    className={cssClasses('shell__header', {
      [className]: !!className,
    })}
  >
    <div className={cssClasses('shell__headerTitle')}>
      {Icon ? (
        <div className={cssClasses('shell__headerIcon')}>
          <Icon />
        </div>
      ) : null}
      {title ? <div className={cssClasses('shell__headerText')}>{title}</div> : null}
    </div>
    {children ? <div className={cssClasses('shell__headerActions')}>{children}</div> : null}
  </div>
)

ShellHeader.defaultProps = {
  children: false,
  title: false,
  icon: false,
  className: null,
}

ShellHeader.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.bool]),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  className: PropTypes.string,
}

export default ShellHeader
