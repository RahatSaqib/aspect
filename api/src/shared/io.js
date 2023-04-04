/* eslint-disable security/detect-non-literal-fs-filename */
const fs = require('fs')
const uuid = require('node-uuid')
const excel = require('exceljs') // see https://www.npmjs.com/package/exceljs
const Promise = require('bluebird')
const _ = require('lodash')
const { formatDateOrDefault } = require('./date')

const LANG_DEFAULT = 'en'

// ---------------------------------
// create missing directories in the path and return path back
// Notice - path should NOT start with /
// ---------------------------------
function createDirectory(path) {
  const folderNames = path.split('/')

  // loop paths and make sure all exist
  let dirPath = '.'
  folderNames.forEach(name => {
    dirPath += `/${name}`
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath)
    }
  })

  return path
}

// ---------------------------------
// get directory for export file - with pattern 'temp/yyyy-MM-dd/HH/UUID'
// ---------------------------------
function getExportDirectory() {
  const dt = new Date()

  // pattern for random directory is /temp/yyyy-MM-dd/HH/uuid, using time-based UUID (v1)
  const relPath = `/temp/${dt.getUTCFullYear()}-${
    dt.getUTCMonth() + 1
  }-${dt.getUTCDate()}/${dt.getUTCHours()}/${uuid.v1()}`

  // export directory is in 'dist/temp' folder of the web site
  const dirFull = `./../web/dist/${relPath}`

  // ---memo--------
  // time part (yyyy-MM-dd/HH) allows auto-deleting old folders by external process - i.e. every
  // 2 hours delete folders from 2-hours back. If lots of files are being generated (millions
  // every hour) - may add MM to path for tracking minutes too
  // -----------
  return {
    full: createDirectory(dirFull),
    url: relPath,
  }
}

// ---------------------------------
// getCellsByValue - helper function for getting all cells having requested value
// ---------------------------------
const getCellsByValue = (sheet, value) => {
  const cells = []
  if (sheet) {
    sheet.eachRow(row => {
      row.eachCell(cell => {
        if (cell.value === value) {
          cells.push(cell)
        }
      })
    })
  }
  return cells
}
// ---------------------------------
// getCellsBySubstring - getting all cells having requested value as substring
// ---------------------------------
const getCellsBySubstring = (sheet, value) => {
  const cells = []
  if (sheet) {
    sheet.eachRow(row => {
      row.eachCell(cell => {
        if (cell.text.includes(value)) {
          cells.push(cell)
        }
      })
    })
  }
  return cells
}

// ---------------------------------
// read Text file
// ---------------------------------
// read Text file and return a string
async function readTextFile(filePath, encoding = 'utf8') {
  return Promise.promisify(fs.readFile)(filePath, encoding)
}

// ---------------------------------
// read/write Excel file - 'exceljs' API returns Promise for readFile and writeFile
// ---------------------------------
// read Excel file and return workbook
async function readExcelFile(fileName) {
  const ExcelWorkbook = new excel.Workbook()
  return ExcelWorkbook.xlsx.readFile(fileName)
}

// write workbook into Excel and Csv file
async function writeExcelFile(fileName, workbook) {
  return await workbook.xlsx.writeFile(fileName).then(() => true) //eslint-disable-line
}

async function writeCsvFile(fileName, workbook) {
  return await workbook.csv.writeFile(fileName).then(() => true) //eslint-disable-line
}

/**
 * Writes a buffer or data stream into a file.
 * @param {*} filename - fileName
 * @param {*} data - stream object or data buffer. The method will detect which and act in response.
 */
async function writeDataToFile(filename, data) {
  return new Promise(resolve => {
    const writeStream = fs.createWriteStream(filename, { flags: 'w' })
    if (Buffer.isBuffer(data)) {
      writeStream.write(data)
      writeStream.end()
      resolve()
    } else {
      data.pipe(writeStream)
      writeStream.on('close', resolve)
    }
  })
}

async function readDataFromFile(filename) {
  const data = await fs.promises.readFile(filename)
  return Buffer.from(data)
}

// ---------------------------------
// generate Excel file for given template,
// props = { templateFileName, outputFileName, populateData }
// ---------------------------------
async function generateExcelFile(props) {
  const message = null

  // template file in folder /templates
  const fileName = `${createDirectory('templates')}/${props.templateFileName}`

  // read file into workbook
  const workbook = await readExcelFile(fileName)

  // execute callback function to populate workbook with caller-side data
  props.populateData(workbook)

  const dir = getExportDirectory() // get path for export directory
  const ok = await writeExcelFile(`${dir.full}/${props.outputFileName}`, workbook)
  return { ok, url: `${dir.url}/${props.outputFileName}`, message }
}

// ---------------------------------
// generate CSV file - string arrays columnNames and fieldNames should have same size
// ---------------------------------
async function generateCsvFile(outputFileName, items, columnNames, fieldNames) {
  const message = null

  const workbook = new excel.Workbook()
  const worksheet = workbook.addWorksheet()

  // column headers (for 1st row in CSV)
  const columns = []
  columnNames.forEach(columnName => {
    columns.push({ header: columnName })
  })
  worksheet.columns = columns

  // add an array of rows
  const rows = []
  items.forEach(dataItem => {
    const row = []
    fieldNames.forEach(fieldName => {
      row.push(formatCellContent(dataItem[fieldName]))
    })
    rows.push(row)
  })
  worksheet.addRows(rows)

  const dir = getExportDirectory() // get path for export directory
  const ok = await writeCsvFile(`${dir.full}/${outputFileName}`, workbook)
  return { ok, url: `${dir.url}/${outputFileName}`, message }
}

// ---------------------------------
// generate CSV attachment in memory - string arrays columnNames and fieldNames should have same size
// ---------------------------------
async function generateCsvAttachment(outputFileName, { items, columns }) {
  const workbook = new excel.Workbook()
  const worksheet = workbook.addWorksheet()

  // column headers (for 1st row in CSV)
  worksheet.columns = columns.map(column => _.pick(column, ['header']))

  // add an array of rows
  const rows = []
  items.forEach(dataItem => {
    const row = []
    columns.forEach(column => {
      row.push(formatCellContent(dataItem[column.key]))
    })
    rows.push(row)
  })
  worksheet.addRows(rows)

  const fileBuffer = await workbook.csv.writeBuffer()
  return {
    content: fileBuffer.toString('base64'),
    mimeType: 'application/vnd.ms-excel',
    fileName: outputFileName,
    disposition: 'attachment',
  }
}

function formatCellContent(cellContent) {
  if (cellContent instanceof Date) {
    cellContent = formatDateOrDefault(cellContent, 'yyyy-MM-dd HH:mm:ss')
  }
  return cellContent
}

// ----------------------------------------------------------------------------------------------
function getContentType(fileExt, streamResponse) {
  if (streamResponse) {
    return 'stream/octet-stream'
  }

  if (fileExt[0] === '.') {
    fileExt = fileExt.substr(1)
  }
  switch (fileExt) {
    case 'pdf':
      return 'application/pdf'
    case 'ppt':
      return 'application/vnd.ms-powerpoint'
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.preplyentationml.preplyentation'
    case 'xls':
      return 'application/vnd.ms-excel'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'csv':
      return 'application/octet-stream'
    case 'xml':
      return 'application/xml'
    default:
      return ''
  }
}

// ----------------------------------------------------------------------------------------------
function getTemplateFilePath(templateFolderPath, { lang, langDefault = LANG_DEFAULT, countryAbbreviation }) {
  const countryAbbreviationLo = countryAbbreviation?.toLowerCase()
  const baseFolderPath = `templates/${templateFolderPath}`
  let filePath = null
  let exists = null
  /**
   * 1. try to use file in country folder
   */
  if (countryAbbreviationLo) {
    const countryFolderPath = `${baseFolderPath}/${countryAbbreviationLo}`
    if (fs.existsSync(countryFolderPath)) {
      filePath = `${countryFolderPath}/${lang}.xlsx`
      exists = fs.existsSync(filePath)
      if (exists) {
        return { filePath, exists }
      }
      if (lang !== langDefault) {
        filePath = `${countryFolderPath}/${langDefault}.xlsx`
        exists = fs.existsSync(filePath)
        if (exists) {
          return { filePath, exists }
        }
      }
    }
  }

  /**
   * 2. try to use file in base folder of report template
   */
  // TODO: think how to differ files for the same language but different partners
  // TODO: see Jira task - https://ops.systemone.id/browse/ASP-1451
  filePath = `${baseFolderPath}/${lang}.xlsx`
  // check if file exists, fallback to default language, throw error if no file found
  exists = fs.existsSync(filePath)
  if (!exists && lang !== langDefault) {
    filePath = `${baseFolderPath}/${langDefault}.xlsx`
    exists = fs.existsSync(filePath)
  }

  return { filePath, exists }
}

// ----------------------------------------------------------------------------------------------
async function readTemplateFile(templateFolderPath, { lang, langDefault = LANG_DEFAULT, countryAbbreviation }) {
  const { filePath, exists } = getTemplateFilePath(templateFolderPath, {
    lang,
    langDefault,
    countryAbbreviation,
  })

  // throw exception if no file found
  if (!exists) {
    throw new Error(`File ${filePath} is missing`)
  }

  // return promise with file content
  return readExcelFile(filePath)
}

function getContentDispositionFilename(fileNamePrefix, extension) {
  return `${fileNamePrefix}_${new Date().toISOString()}.${extension}`.replace(/:/g, '-')
}

module.exports = {
  createDirectory,
  generateCsvFile,
  generateCsvAttachment,
  generateExcelFile,
  getCellsBySubstring,
  getCellsByValue,
  getContentType,
  getExportDirectory,
  readExcelFile,
  readTextFile,
  readTemplateFile,
  writeDataToFile,
  readDataFromFile,
  getContentDispositionFilename,
}
