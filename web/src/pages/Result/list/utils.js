import filter from 'lodash/filter'
import identity from 'lodash/identity'
import map from 'lodash/map'
import partial from 'lodash/partial'
import without from 'lodash/without'
import { ALL_KEY, PAGE_SIZE_BUTTON_KEYS } from '../../../components/shared/TablePaginator'
import messages from './messages'

const messageByI18nKey = partial(
  // Explicit declare messageBy[i18nKey] so that the keys are searchable.
  (messageBy, i18nKey) => messageBy[i18nKey] || messageBy.default,
  {
    resultCategoryCopiesMl: (title, formatMessage) => formatMessage(messages.resultCategoryCopiesMl),
    default: identity,
  }
)

export const RESULT_PAGE_SIZE_BUTTON_KEYS = without(PAGE_SIZE_BUTTON_KEYS, ALL_KEY)

export const getBaseColumns = (extraColumns = [], formatMessage) => {
  return filter(
    [
      { key: 'endedOn', label: formatMessage(messages.endedOn), sortable: true },
      { key: 'deviceName', label: formatMessage(messages.deviceName), sortable: true, hiddenOn: 'xs' },
      {
        key: 'sampleOriginSiteName',
        label: formatMessage(messages.sampleOriginSiteName),
        sortable: true,
        hiddenOn: 'sm',
      },
      { key: 'sampleId', label: formatMessage(messages.sampleId), sortable: true },
      { key: 'assayName', label: formatMessage(messages.assayName), sortable: true },
      { key: 'resultText', label: formatMessage(messages.resultText), sortable: true },
      ...map(extraColumns, column => ({
        key: column?.fieldName,
        label: messageByI18nKey(column?.i18nKey)(column?.title, formatMessage),
        sortable: true,
        hiddenOn: 'md',
      })),
      { key: 'errorCode', label: formatMessage(messages.errorCode), sortable: true, hiddenOn: 'lg' },
      {
        key: 'treatmentStatusInfo',
        label: formatMessage(messages.resultTreatmentStatus),
        sortable: true,
        hiddenOn: 'md',
        auth: ['+reporter'],
      },
      { key: 'patientId', label: formatMessage(messages.patientId), sortable: true, hiddenOn: 'xs' },
    ],
    elem => (extraColumns.length > 0 && elem.key !== 'resultText') || extraColumns.length === 0
  )
}
