import React from 'react'
import classNames from 'classnames/bind'
import IconProvider from '../../IconProvider'
import styles from './AspectMessageField.css'

const cssClasses = classNames.bind(styles)

const AspectMessageField = ({ controlType: { text, color, icon } }) => {
  return (
    <div className={cssClasses('messageField')} style={{ color }}>
      {icon && <IconProvider icon={icon} />}{' '}
      <div className={cssClasses('text')}>
        {text.split('\n').map((t, index) => (
          <div key={index}>
            {t}
            <br />
          </div>
        ))}
      </div>
    </div>
  )
}

export default AspectMessageField
