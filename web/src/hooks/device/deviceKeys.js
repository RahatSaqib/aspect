const DEVICE_KEY = 'DEVICE'
const DEVICE_KEY_BY_ID_ENDPOINT = '/device/:deviceId'
const DEVICE_KEY_DEVICE_LIST_ENDPOINT =
  '/device/select-list?countryId=:countryId&partnerId=:partnerId&siteId=:siteId&showUnapprovedDevices=:showUnapprovedDevices&onlyResultDevices=:onlyResultDevices'
const DEVICE_KEY_MERGE_DEVICES_ENDPOINT = '/device/mergedevices'
const DEVICE_PERFORMANCE_KEY_BY_ID_ENDPOINT = '/device/performance/:deviceId?timezoneOffset=:offset'
const DEVICE_CAPACITY_KEY_ENDPOINT = '/device/capacity/select-list?deviceTypeId=:deviceTypeId'

export {
  DEVICE_KEY,
  DEVICE_KEY_BY_ID_ENDPOINT,
  DEVICE_KEY_DEVICE_LIST_ENDPOINT,
  DEVICE_KEY_MERGE_DEVICES_ENDPOINT,
  DEVICE_PERFORMANCE_KEY_BY_ID_ENDPOINT,
  DEVICE_CAPACITY_KEY_ENDPOINT,
}
