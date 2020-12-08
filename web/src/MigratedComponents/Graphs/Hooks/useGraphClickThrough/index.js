import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from 'react-query'

import startOfMonth from 'date-fns/startOfMonth'
import endOfMonth from 'date-fns/endOfMonth'
import parse from 'date-fns/parse'
import map from 'lodash/map'
import uniqBy from 'lodash/uniqBy'
import filter from 'lodash/filter'

import ASSAY_LIST from '../../../QueryFetch/Assay'
import fetchWrapperForQueries from '../../../QueryFetch'

const parseDate = (date, dateFormat) => {
  const newDate = parse(date, dateFormat, new Date())
  return {
    minDate: startOfMonth(newDate).toISOString(),
    maxDate: endOfMonth(newDate).toISOString(),
  }
}

const flattenAssaysStructure = async ({ data }) => {
  const output = []
  map(data, ({ resultCategories }) =>
    map(resultCategories, category => output.push({ ...category }))
  )
  return uniqBy(output, 'i18nKey')
}

const assayCategoryIfFromKey = async (data, id) => {
  return filter(data, { externalId: id })[0] || false
}

const useGraphClickThrough = () => {
  const { push } = useHistory()
  const [link, setLink] = useState(false)
  const [config, setConfig] = useState(false)
  const [linkData, setLinkData] = useState(false)

  const { isLoading, isError, error } = useQuery(
    ASSAY_LIST.KEY,
    async () => fetchWrapperForQueries({ endpoint: ASSAY_LIST.ENDPOINT }),
    { onSuccess: setLinkData }
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    async function buildLink(
      linkData,
      month,
      formatDate,
      id,
      indexBy,
      baseUrl,
      keys
    ) {
      const params = {}
      const buildParamsFromKey = async (key, params) => {
        if (key === 'indexBy' && indexBy === 'month') {
          const { minDate, maxDate } = parseDate(month, formatDate)
          params.minDate = minDate
          params.maxDate = maxDate
        }

        if (key === 'resultCategoryId') {
          const categories = await flattenAssaysStructure(linkData)
          const { id: resultCategoryId } = await assayCategoryIfFromKey(
            categories,
            id
          )
          params.resultCategoryId = resultCategoryId
          params.assayOverride = id
        }
      }
      await Promise.all(map(keys, key => buildParamsFromKey(key, params)))
      setLink(
        `${baseUrl}?filters=${encodeURIComponent(
          new URLSearchParams(params).toString()
        )}`
      )
    }

    if (!isLoading && config && linkData) {
      const {
        value: {
          data: { month },
          id,
        },
        baseConfig: {
          indexBy,
          formatDate,
          clickThrough: { allow, baseUrl, keys } = false,
        },
      } = config

      if (allow) {
        buildLink(linkData, month, formatDate, id, indexBy, baseUrl, keys)
      }
    }
  }, [config, linkData, isLoading, push])

  useEffect(() => {
    if (link) {
      push(link)
    }
  }, [link, push])

  return { setConfig }
}

export default useGraphClickThrough
