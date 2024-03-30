import React from 'react'
import IconProvider from '../../IconProvider'
import styles from './AspectMessageField.module.css'

const AspectMessageField = ({ controlType: { text, color, icon } }) => {
  return (
    <div className={styles.messageField} style={{ color }}>
      {icon && <IconProvider icon={icon} />}{' '}
      <div className={styles.text}>
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
