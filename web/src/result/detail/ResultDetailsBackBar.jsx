import React from 'react'
import DetailBackBar from '../../globals/components/DetailBackBar'

const ResultDetailsBackBar = ({ history, location, match, title }) => {
  const onBackClick = () => {
    history.push('/browse/result')
  }

  return (
    <DetailBackBar
      history={history}
      location={location}
      match={match}
      onBackClick={onBackClick}
      title={title}
    />
  )
}

export default ResultDetailsBackBar
