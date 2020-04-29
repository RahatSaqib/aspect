import React from 'react';
import classnames from 'classnames/bind';

const cssClasses = classnames.bind(require('./Title.css'));

export const Title = ({ icon, title }) => (
  <div className={cssClasses('title__container')}>
    {icon}
    <span className={cssClasses('title__label')}>{title}</span>
  </div>
);

export default Title;
