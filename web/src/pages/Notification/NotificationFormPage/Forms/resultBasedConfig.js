import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import { getBaseData } from '../../../../components/Form/Formik/Helpers'
import ASSAY_LIST from '../../../../components/QueryFetch/Assay'
import messages from '../messages'

const resultBasedSection = formatMessage => {
  return {
    id: 'whenResultIs',
    label: 'whenResultIs',
    labelI18nKey: 'whenResultIs',
    visibleIf: values => ['resultBased'].includes(values.notificationType),
    rows: [
      {
        id: 'result',
        isMulti: true,
        items: [
          {
            id: 'assayId',
            controlType: {
              component: 'select',
              endpoint: ASSAY_LIST.ENDPOINT,
              hideIfNoOptions: false,
              queryKey: ASSAY_LIST.KEY,
              normalizeLoadedData: response => {
                const { ok, data } = response
                const options = ok === true ? getBaseData(data, formatMessage, messages) : []
                return options
              },
              placeholder: formatMessage(messages.assayPlaceholder),
            },
            labelI18nKey: 'assayTitle',
          },
          {
            id: 'resultCategoryId',
            controlType: {
              component: 'select',
              endpoint: ASSAY_LIST.ENDPOINT,
              hideIfNoOptions: false,
              isMulti: true,
              queryKey: ASSAY_LIST.KEY,
              normalizeLoadedData: (response, formik, subRowIndex) => {
                let options = []
                const { assayId: selectedAssayId } = formik.values.result[subRowIndex]
                if (selectedAssayId) {
                  const { ok, data } = response
                  if (ok === true) {
                    const selectedAssay = data.find(({ externalId }) => externalId === selectedAssayId)
                    const { resultCategories = [], resultCategoryGroups } = selectedAssay || {}
                    const scope =
                      isArray(resultCategoryGroups) && !isEmpty(resultCategoryGroups)
                        ? 'ResultCategoryGroups'
                        : 'ResultCategories'
                    options = getBaseData(
                      scope === 'ResultCategoryGroups' ? resultCategoryGroups : resultCategories,
                      formatMessage,
                      messages
                    )
                    options = options.map(it => ({ ...it, scope }))
                  }
                }
                return options
              },
              dependencies: ['result[{{subRowIndex}}].assayId'],
              placeholder: formatMessage(messages.resultPlaceholder),
            },
            labelI18nKey: 'resultTitle',
          },
        ],
      },
    ],
  }
}

export { resultBasedSection }
