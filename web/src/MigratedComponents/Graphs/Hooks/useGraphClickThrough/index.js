import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from 'react-query'

import startOfMonth from 'date-fns/startOfMonth'
import endOfMonth from 'date-fns/endOfMonth'
import parse from 'date-fns/parse'
import format from 'date-fns/format'
import map from 'lodash/map'
import uniqBy from 'lodash/uniqBy'
import filter from 'lodash/filter'

import ASSAY_LIST from '../../../QueryFetch/Assay'
import fetchWrapperForQueries from '../../../QueryFetch'

const parseDate = (date, dateFormat) => {
  const newDate = parse(date, dateFormat, new Date())
  return {
    minDate: format(startOfMonth(newDate), 'yyyy-MM-dd'),
    maxDate: format(endOfMonth(newDate), 'yyyy-MM-dd'),
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
    async function buildLink(linkData, month, formatDate, indexBy, id) {
      const categories = await flattenAssaysStructure(linkData)
      const { id: resultCategoryId } = await assayCategoryIfFromKey(
        categories,
        id
      )
      const { minDate, maxDate } = parseDate(month, formatDate)
      const url = `/browse/result?filters=resultCategoryId=${resultCategoryId}&minDate=${minDate}&maxDate=${maxDate}`
      setLink(url)
    }

    if (!isLoading && config && linkData && !link) {
      const {
        value: {
          data: { month },
          id,
        },
        baseConfig: { indexBy, formatDate },
      } = config
      buildLink(linkData, month, formatDate, indexBy, id)
    }

    if (!isLoading && link) {
      push(link)
    }
  }, [config, link, linkData, isLoading, push])

  return { setConfig }
}

export default useGraphClickThrough
