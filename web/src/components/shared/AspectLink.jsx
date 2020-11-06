import React from 'react'
import { Link } from 'react-router-dom'

const isURL = to => {
  if (!to) return false
  const expression = /^https?:/
  const regex = new RegExp(expression)
  return to.match(regex)
}

const urlFromShape = ({ url, search, data = null }) => {
  let link = `${url}?`
  if (search) {
    Object.keys(search).forEach(sKey => {
      link += `${sKey}=`

      const searchSection = search[sKey]
      let searchSectionString = ''
      searchSection.forEach(([pKey, pData]) => {
        let pValue = null

        switch (typeof pData) {
          case 'function':
            pValue = pData(data)
            break
          case 'string':
            pValue = data[pData] ? data[pData] : pData
            break
          default:
            pValue = pData
        }

        searchSectionString += `${pKey}=${pValue}&`
      })
      searchSectionString = encodeURIComponent(
        searchSectionString.substring(0, searchSectionString.length - 1)
      )

      link += `${searchSectionString}&`
    })
    link = link.substring(0, link.length - 1)
  }

  // console.log(link)
  return link

  // const [urlSection, paramsSection,  ...paramsKeys] = linkTo
  // if (paramsKeys && paramsKeys.length > 0) {
  //   console.log(row)
  //   const params = paramsKeys.map(k => row[k])
  //   paramsSection = paramsSection.format(...params)
  // } else
  //   linkTo = urlSection

  // const urlSections = linkTo.split('?')
  // if (urlSections.length > 1)
  //   linkTo = `${urlSection}?${encodeURIComponent(paramsSection)}`
}

const AspectLink = ({ to = '#', children, ...restProps }) => {
  if (to && typeof to === 'object') {
    to = urlFromShape(to)
  }

  return isURL(to) ? (
    <a href={to} target="_blank" {...restProps} rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link to={to} {...restProps}>
      {children}
    </Link>
  )
}

export default AspectLink
