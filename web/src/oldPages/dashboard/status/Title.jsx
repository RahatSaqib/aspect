import React from 'react'
import styles from './index.module.css'

const Title = ({ className, icon, title }) => (
  <div className={`${styles.Title} ${styles[className]}`}>
    {icon}
    <span className={`${styles.Title__Label} ${styles[className]}`}>{title}</span>
  </div>
)

export default Title
