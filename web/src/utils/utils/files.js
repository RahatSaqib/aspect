import format from 'date-fns/format'

function safeDownloadFile(blob, fileName) {
  const fileURL = URL.createObjectURL(blob)
  const fileLink = document.createElement('a')
  fileLink.href = fileURL
  fileLink.download = fileName
  document.body.appendChild(fileLink)
  fileLink.click()
  setTimeout(() => {
    document.body.removeChild(fileLink)
    window.URL.revokeObjectURL(fileURL)
  }, 100)
}

function downloadFile(blob, reportName, reportFormat) {
  const fileName = `${reportName}_${format(new Date(), 'yyyy_MM_dd_HH_mm_ss')}.${reportFormat}`
  safeDownloadFile(blob, fileName)
}

export { safeDownloadFile, downloadFile }
