const fs = require('fs')
const uuid = require('node-uuid')
const excel = require('exceljs') // see https://www.npmjs.com/package/exceljs

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
// get directory for export file - with pattern 'temp/YYYY-MM-DD/HH/UUID'
// ---------------------------------
function getExportDirectory() {
  const dt = new Date()

  // pattern for random directory is /temp/YYYY-MM-DD/HH/uuid, using time-based UUID (v1)
  const relPath = `/temp/${dt.getUTCFullYear()}-${dt.getUTCMonth() +
    1}-${dt.getUTCDate()}/${dt.getUTCHours()}/${uuid.v1()}`

  // export directory is in 'dist/temp' folder of the web site
  const dirFull = `./../web/dist/${relPath}`

  // ---memo--------
  // time part (YYYY-MM-DD/HH) allows auto-deleting old folders by external process - i.e. every
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
  sheet.eachRow(row => {
    row.eachCell(cell => {
      if (cell.value === value) {
        cells.push(cell)
      }
    })
  })
  return cells
}

// ---------------------------------
// read/write Excel file - 'exceljs' API returns Promise for readFile and writeFile
// ---------------------------------
// read Excel file and return workbook
async function readExcelFile(fileName) {
  return await new excel.Workbook().xlsx //eslint-disable-line
    .readFile(fileName)
    .then(workbook => workbook)
}
// write workbook into Excel and Csv file
async function writeExcelFile(fileName, workbook) {
  return await workbook.xlsx.writeFile(fileName).then(() => true) //eslint-disable-line
}

async function writeCsvFile(fileName, workbook) {
  return await workbook.csv.writeFile(fileName).then(() => true) //eslint-disable-line
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
  const ok = await writeExcelFile(
    `${dir.full}/${props.outputFileName}`,
    workbook
  )
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
      row.push(dataItem[fieldName])
    })
    rows.push(row)
  })
  worksheet.addRows(rows)

  const dir = getExportDirectory() // get path for export directory
  const ok = await writeCsvFile(`${dir.full}/${outputFileName}`, workbook)
  return { ok, url: `${dir.url}/${outputFileName}`, message }
}

module.exports = {
  createDirectory,
  getExportDirectory,
  getCellsByValue,
  generateExcelFile,
  generateCsvFile,
}
