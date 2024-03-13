import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const useHashAndScroll = () => {
  const location = useLocation()
  useEffect(() => {
    const { hash = '' } = location
    setTimeout(() => {
      const nodeList = document.querySelectorAll(`[name="${hash.replace('#', '')}"]`)
      if (nodeList && nodeList.length) {
        nodeList[0].scrollIntoView({ behavior: 'smooth' })
      }
    }, 0)
  }, [location])
}

export default useHashAndScroll
