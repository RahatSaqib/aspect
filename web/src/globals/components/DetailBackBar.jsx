import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import KeyboardArrowLeft from 'react-icons/lib/md/keyboard-arrow-left'

const cssClasses = classnames.bind(require('./DetailBackBar.css'))

const enhance = compose(
  pure,
  withProps(({ match, matchId }) => ({
    matchId: match[matchId],
  })),
  withHandlers({
    onBackClick: ({ history }) => () => {
      history.goBack()
    },

    onViewClick: ({ history, location, matchId }) => () => {
      history.push({
        pathname: location.pathname.replace(/\d+$/, matchId),
      })
    },

    onHistoryClick: ({ history, location, matchId }) => () => {
      history.push({
        pathname: location.pathname.replace(/\d+$/, matchId),
      })
    },
  })
)

export const DetailBackBar = ({ onBackClick, onViewClick, onHistoryClick }) =>
  <div className={cssClasses('Container')}>
    <Button
      className={cssClasses('Container__Button--back')}
      onClick={onBackClick}
      primary
      theme={{
        flat: cssClasses('Button--flat'),
        primary: cssClasses('Button--primary'),
      }}
    >
      <KeyboardArrowLeft />
    </Button>
    <div className={cssClasses('Container__Title')}>
      TB MTB+ Rif+ in Western Region
    </div>
    <div className={cssClasses('Container__BtnGroup')}>
      <Button onClick={onViewClick} primary>
        View
      </Button>
      <Button onClick={onViewClick} primary>
        Edit
      </Button>
      <Button onClick={onHistoryClick} primary>
        History
      </Button>
    </div>
  </div>

export default enhance(DetailBackBar)
