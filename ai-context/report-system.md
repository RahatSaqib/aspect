# Report System - AI Context

## Overview

The report system is a comprehensive feature for generating Excel and CSV reports with both synchronous and asynchronous processing capabilities. It supports dynamic data population, templated Excel files, and multi-sheet reports with complex data transformations.

## Core Components

### 1. Report Engine (`api/src/shared/report.js`)

The central engine that manages async report generation and user report access:

- **Async Report Management**: Handles `AsyncReport` entities with status tracking (queued, processing, ready, error)
- **Query Hashing**: Creates unique hashes for report queries to enable caching and duplicate detection
- **User Report Access**: Manages user permissions and report history via `UserReportRequest` entities
- **Data Filtering**: Supports filtering by states, consumables, countries, and date ranges

```javascript
// Key functions:
getAllAsyncReportsForUser(query, personId)  // Gets user's report history
getExistingReportWithHash(hash)            // Checks for existing reports
updateAsyncReport(asyncReportId, payload)   // Updates report status
```

### 2. Report Definitions (`api/seeds/bangladesh/fixtures/reports.js`)

Database-seeded configurations that define report structure:

```javascript
const reportDefinition = {
  name: 'Report on Xpert MTB/RIF and Covid',
  description: 'DR-TB 10A-10B and Covid reporting format...',
  i18nKey: 'reportDrTb10a10bCovid',
  externalId: 'results_10a_10b_covid', // Links to template folder
  fileName: 'ReportDrTb10a10bCovid',
  exportCsv: false,
  availableForNotification: 1,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportDrTb10A',
      query: { nameOfSharedData: 'results_10a' }
    }
    // Additional sheets...
  ]
}
```

**Key Properties:**
- `externalId`: Must match folder name in `/api/templates/`
- `sheets`: Array defining data sources for each Excel sheet
- `moduleName`/`functionName`: Points to service functions that generate data
- `query`: Parameters passed to data generation functions

### 3. Excel Templates (`api/templates/`)

Pre-formatted Excel files with:
- **Placeholders**: `<Dates>`, `<States>`, `<Sites>`, `<UserEmail>`, etc.
- **Table Tokens**: `<Table>` marks where dynamic data tables begin
- **Field Tokens**: `<fieldName>` in cells indicates data binding points
- **Styling**: Pre-defined formatting, fonts, colors, borders

### 4. Mapping Files (`api/templates/*/mapping.js`)

Special files that map Excel cell addresses to data field names:

```javascript
module.exports = [
  {
    // Sheet 0 mapping
    B8: 'totalModuleSwaps',
    B9: 'numberOfSites',
    C6: 'stateName',
    C7: 'lgaName',
    M19: 'cnt_Presumptive_DR_TB_Cases_Invalid_Mtb'
  },
  {
    // Sheet 1 mapping (if multi-sheet)
    F9: 'total'
  }
]
```

**Usage:**
- Array index corresponds to Excel sheet index (0-based)
- Each object maps cell addresses (e.g., 'B8') to data property names
- Used for reports requiring specific cell population rather than table generation

### 5. Service Report Functions

Data generation functions that create report datasets:

```javascript
async function getModuleSwapsReportData(dataConstraints, query) {
  const swaps = await getDeviceBaseExtendedQuery(query, dataConstraints)
    .innerJoin('Issue as i', 'i.deviceId', 'd.id')
    .select('d.name as deviceName', 's.name as siteName')
    // Complex SQL queries...

  return {
    data: {
      rows: swaps,                    // For table-based reports
      totalModuleSwaps: swaps.length, // For mapping-based reports
      numberOfSites: new Set(swaps.map(s => s.siteId)).size
    }
  }
}
```

## Report Processing Flow

### Synchronous Reports
1. User requests report via API endpoint
2. System calls service function to generate data
3. Data is immediately processed with Excel template
4. Response returned as file download

### Asynchronous Reports
1. User submits report request
2. System creates `AsyncReport` record with "queued" status
3. Job queue processes request in background:
   - Updates status to "processing"
   - Calls `generateReport()` function
   - Processes data with template
   - Saves file and updates status to "ready"
4. User receives notification and can download file

```javascript
// Async processing pipeline:
processAsyncReportRequest() → saveReportAndPushToQueue() → 
queue.add() → processAsyncReport() → generateReport() → 
renderExcelTemplate() → writeDataToFile()
```

## Excel Generation Modes

### 1. List Mode (Table-based)
- Data appears as `{ data: [array_of_objects] }`
- Uses `<Table>` tokens in templates
- Generates dynamic rows based on data array
- Good for: Device lists, result tables, inventory reports

### 2. Mapping Mode (Cell-specific)
- Data appears as `{ data: { prop1: value1, prop2: value2 } }`
- Uses `mapping.js` files to populate specific cells
- Good for: Summary reports, dashboards, forms with specific layouts

### 3. Hybrid Mode
- Combines both approaches
- Uses mapping for summary data and tables for detailed data
- Example: Module swaps report with summary stats + detailed table

## Template Processing (`api/src/shared/excel.js`)

### Key Functions:

**`renderExcelTemplate()`**: Full template processing for complex reports
- Loads Excel template file
- Processes all sheets
- Handles both mapping and list modes
- Supports dynamic columns
- Applies all replacements and formatting

**`renderExcelStream()`**: Streaming for large reports
- Processes data in chunks
- Better memory efficiency
- Used for reports with large datasets

**`fillInSheetWithMap()`**: Mapping file processor
```javascript
function fillInSheetWithMap({ templateFolderPath, sheetIndex, dataSet, worksheet }) {
  // Load mapping.js file
  const mapping = require(`../../templates/${templateFolderPath}/mapping`)
  const sheetMap = mapping[sheetIndex]
  
  // Populate each mapped cell
  _.keys(sheetMap).forEach(cellAddress => {
    const fieldName = sheetMap[cellAddress]
    const cell = worksheet.getCell(cellAddress)
    cell.value = data[fieldName]
  })
}
```

## Placeholder System

### Global Placeholders (auto-replaced):
- `<Dates>`: Date range from query
- `<States>`: Selected states
- `<Sites>`: Selected sites  
- `<UserEmail>`: Current user's email
- `<UserFullName>`: Current user's name
- `<ReportDate>`: Current date

### Custom Replacements:
Service functions can return custom replacements:
```javascript
return {
  data: { /* report data */ },
  replacements: [
    { placeholder: '<CustomValue>', value: computedValue }
  ]
}
```

## Data Constraints & Security

- **User Permissions**: Reports respect user's geographic and functional access
- **Data Constraints**: Automatically applied based on user's role
- **Query Validation**: Input validation prevents unauthorized data access
- **Caching**: Query hashing enables secure result caching

## File Structure

```
api/
├── templates/                          # Excel templates
│   ├── module_swaps/
│   │   ├── en.xlsx                    # English template
│   │   └── mapping.js                 # Cell mapping
│   └── results_10a_10b_covid/
│       ├── en.xlsx
│       └── mapping.js
├── src/
│   ├── shared/
│   │   ├── report.js                  # Core report engine
│   │   └── excel.js                   # Excel processing
│   ├── report/
│   │   ├── serviceReports.js          # Report orchestration
│   │   ├── processAsyncReport.js      # Async processing
│   │   └── endpoints.js               # API endpoints
│   └── device/serviceReports/
│       └── moduleSwapsReport.js       # Data generation
└── seeds/
    └── bangladesh/fixtures/
        └── reports.js                 # Report definitions
```

## Best Practices

### Creating New Reports:

1. **Define Report Configuration**: Add to appropriate `seeds/*/fixtures/reports.js`
2. **Create Template**: Design Excel file in `templates/{externalId}/`
3. **Create Mapping**: If needed, add `mapping.js` for cell-specific data
4. **Implement Service**: Create data generation function
5. **Test Both Modes**: Verify sync and async generation

### Template Design:
- Use clear placeholder names: `<FieldName>` not `<field>`
- Design for both data and no-data scenarios
- Include proper formatting and styling
- Test with various data volumes

### Performance:
- Use streaming mode for large datasets
- Implement proper indexing in service queries
- Consider data pagination for massive reports
- Cache frequently requested reports

## Common Patterns

### Multi-sheet Reports:
```javascript
sheets: [
  { functionName: 'getSheet1Data', query: { sheetType: 'summary' } },
  { functionName: 'getSheet2Data', query: { sheetType: 'details' } }
]
```

### Shared Data Between Sheets:
```javascript
// Sheet 1 generates and stores data
{ functionName: 'getData', query: { nameOfSharedData: 'results' } }
// Sheet 2 uses stored data  
{ functionName: 'processData', query: { useNamedData: 'results' } }
```

### Dynamic Columns:
```javascript
return {
  data: rows,
  dynamicColumns: [
    { header: 'Q1 2023', field: 'q1_2023' },
    { header: 'Q2 2023', field: 'q2_2023' }
  ]
}
```

This report system provides a flexible, scalable solution for generating complex Excel reports with both tabular data and specific cell population, supporting both immediate and background processing workflows.
