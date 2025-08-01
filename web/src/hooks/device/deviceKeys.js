const DEVICE_KEY = 'DEVICE'
const DEVICE_KEY_BY_ID_ENDPOINT = '/device/:deviceId'
const DEVICE_KEY_DEVICE_LIST_ENDPOINT =
  '/device/select-list?countryId=:countryId&partnerId=:partnerId&siteId=:siteId&showUnapprovedDevices=:showUnapprovedDevices&onlyResultDevices=:onlyResultDevices'
const DEVICE_KEY_MERGE_DEVICES_ENDPOINT = '/device/mergedevices'
const DEVICE_PERFORMANCE_KEY_BY_ID_ENDPOINT = '/device/performance/:deviceId'
const DEVICE_TYPE_KEY_LIST_ENDPOINT = '/device-type/select-list'
const DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT = '/device/maintenance-statuses'
const DEVICE_APPROVAL_TYPE_ENDPOINT = '/device/approval-types'

export {
  DEVICE_KEY,
  DEVICE_KEY_BY_ID_ENDPOINT,
  DEVICE_KEY_DEVICE_LIST_ENDPOINT,
  DEVICE_KEY_MERGE_DEVICES_ENDPOINT,
  DEVICE_PERFORMANCE_KEY_BY_ID_ENDPOINT,
  DEVICE_TYPE_KEY_LIST_ENDPOINT,
  DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT,
  DEVICE_APPROVAL_TYPE_ENDPOINT,
}
