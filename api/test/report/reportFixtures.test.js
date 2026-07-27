const fs = require('fs')
const path = require('path')
const { assert } = require('chai')

const { DATE_TOKENS, resolveParams, buildParamsValidator } = require('../../src/report/params')

const KNOWN_TYPES = ['dateRange', 'state', 'lga', 'site', 'assay', 'consumable', 'text', 'enum', 'number', 'boolean']
// Types whose labels come from the legacy global filter — everything else must carry its own i18nKey/label.
const LEGACY_TYPES = ['dateRange', 'state', 'lga', 'site', 'assay', 'consumable']

const SEEDS_DIR = path.join(__dirname, '../../seeds')

/**
 * Collect every fixture report object: the 30 common ones plus every country
 * `reports.js` (spread-variants like malawi's must also pass — they inherit
 * `parameters` from the common object they spread).
 */
function loadFixtureReports() {
  const reports = []
  const collect = (file, exported) => {
    Object.entries(exported).forEach(([exportKey, report]) => {
      reports.push({ file, exportKey, report })
    })
  }

  // eslint-disable-next-line import/no-dynamic-require
  collect('fixtures/Report.js', require(path.join(SEEDS_DIR, 'fixtures/Report')))

  fs.readdirSync(SEEDS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(SEEDS_DIR, entry.name, 'fixtures/reports.js'))
    .filter(fs.existsSync)
    // eslint-disable-next-line import/no-dynamic-require
    .forEach(file => collect(path.relative(SEEDS_DIR, file), require(file)))

  return reports
}

describe('report fixtures parameters lint', () => {
  const fixtureReports = loadFixtureReports()

  it('loads every fixture report object (30 common + country files)', () => {
    assert.isAtLeast(fixtureReports.length, 46)
  })

  fixtureReports.forEach(({ file, exportKey, report }) => {
    describe(`${file} # ${exportKey} (${report.externalId})`, () => {
      it('declares a non-empty parameters array ([] is reserved for un-reseeded rows)', () => {
        assert.isArray(report.parameters)
        assert.isNotEmpty(report.parameters)
      })

      it('every definition has a known type and a non-empty name', () => {
        report.parameters.forEach(def => {
          assert.isString(def.name, `def name in ${report.externalId}`)
          assert.isNotEmpty(def.name)
          assert.include(KNOWN_TYPES, def.type, `unknown type "${def.type}" for "${def.name}"`)
        })
      })

      it('never authors shared (derived from type at read time, never in fixtures)', () => {
        report.parameters.forEach(def => {
          assert.notProperty(def, 'shared', `"${def.name}" must not declare shared`)
        })
      })

      it('never combines required with permission (hidden-required deadlock)', () => {
        report.parameters.forEach(def => {
          assert.isFalse(Boolean(def.required) && Boolean(def.permission), `"${def.name}" has required AND permission`)
        })
      })

      it('enum definitions carry non-empty options', () => {
        report.parameters
          .filter(def => def.type === 'enum')
          .forEach(def => {
            assert.isArray(def.options, `enum "${def.name}" must declare options`)
            assert.isNotEmpty(def.options)
          })
      })

      it('dateRange defaults are { period: <DATE_TOKEN> }', () => {
        report.parameters
          .filter(def => def.type === 'dateRange' && def.default !== undefined && def.default !== null)
          .forEach(def => {
            assert.isObject(def.default)
            assert.include(DATE_TOKENS, def.default.period, `invalid date token on "${def.name}"`)
          })
      })

      it('every dependsOn references another declared parameter', () => {
        const declaredNames = report.parameters.map(def => def.name)
        report.parameters
          .filter(def => def.dependsOn)
          .forEach(def => {
            assert.include(declaredNames, def.dependsOn, `"${def.name}" dependsOn undeclared "${def.dependsOn}"`)
          })
      })

      it('declared defaults resolve and pass their own validation schema', () => {
        const defsWithDefaults = report.parameters.filter(def => def.default !== undefined && def.default !== null)
        if (!defsWithDefaults.length) return
        const resolved = resolveParams(
          defsWithDefaults,
          {},
          { timeZone: 'Etc/UTC', reportExternalId: report.externalId }
        )
        const validate = buildParamsValidator(defsWithDefaults, { mode: 'strict' })
        assert.doesNotThrow(() => validate(resolved, { reportExternalId: report.externalId }))
      })

      it('non-legacy-type definitions carry i18nKey and label', () => {
        report.parameters
          .filter(def => !LEGACY_TYPES.includes(def.type))
          .forEach(def => {
            assert.isString(def.i18nKey, `"${def.name}" needs an i18nKey`)
            assert.isNotEmpty(def.i18nKey)
            assert.isString(def.label, `"${def.name}" needs a label`)
            assert.isNotEmpty(def.label)
          })
      })
    })
  })
})
