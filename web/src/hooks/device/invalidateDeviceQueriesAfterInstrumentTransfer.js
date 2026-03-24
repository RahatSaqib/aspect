import { DEVICE_KEY } from './deviceKeys'

/**
 * Refreshes device-related React Query caches after instrument transfer, but
 * does not refetch a device that was removed when its last instrument was merged away.
 */
function invalidateDeviceQueriesAfterInstrumentTransfer(queryClient, data) {
  const deletedIds = new Set((data?.deletedDeviceIds || []).map(id => String(id)))
  if (deletedIds.size === 0) {
    queryClient.invalidateQueries([DEVICE_KEY])
    return
  }

  queryClient.invalidateQueries({
    predicate: query => {
      if (query.queryKey[0] !== DEVICE_KEY) {
        return false
      }
      const key = query.queryKey
      if (key.length === 2 && deletedIds.has(String(key[1]))) {
        return false
      }
      if (key.length >= 3 && key[1] === 'performance' && deletedIds.has(String(key[2]))) {
        return false
      }
      return true
    },
  })
}

export default invalidateDeviceQueriesAfterInstrumentTransfer
