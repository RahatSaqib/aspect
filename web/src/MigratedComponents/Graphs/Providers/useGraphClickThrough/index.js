import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

const useGraphClickThrough = () => {
  const { push } = useHistory()
  const [link, setLink] = useState(false)

  useEffect(() => {
    if (link) {
      console.log('fire off link', link)
    }
  }, [link])
  return { setLink }
}

export default useGraphClickThrough
