const { assert, expect } = require('chai')

const { mergeJobFunctions } = require('../../seeds/fixtures/jobFunctionBase')

describe('Seed helpers unit functions', () => {
  const admin = {
    name: 'admin',
    permissions: [
      { module: 'account', activity: 'view' },
      { module: 'device', activity: 'view' },
      { module: 'inventory', activity: 'view' },
      { module: 'issue', activity: 'view' },
      { module: 'report', activity: 'view' },
      { module: 'task', activity: 'view' },
    ],
  }
  const admin2 = {
    name: 'admin',
    permissions: [
      { module: 'account', activity: 'edit' },
      { module: 'report', activity: 'edit' },
      { module: 'task', activity: 'edit' },
    ],
  }

  describe('jobFunctions Helpers', () => {
    it('Should throw exception for trying to merge 2 different jobFunctions', () => {
      expect(() => mergeJobFunctions(admin, { name: 'otherName' })).to.throw('The jobfunction names should be equals')
      expect(() => mergeJobFunctions({ name: 'otherName' }, admin)).to.throw('The jobfunction names should be equals')
    })
    it('Should merge 2 different jobFunctions with the same name', () => {
      assert.deepEqual(mergeJobFunctions(admin, admin2), {
        name: 'admin',
        permissions: [
          { module: 'account', activity: 'edit' },
          { module: 'device', activity: 'view' },
          { module: 'inventory', activity: 'view' },
          { module: 'issue', activity: 'view' },
          { module: 'report', activity: 'edit' },
          { module: 'task', activity: 'edit' },
        ],
      })
      assert.deepEqual(
        mergeJobFunctions(
          {
            name: 'Lab Admin',
            reports: [
              'mtb_detected_rr_detected',
              'critical_errors_by_device',
              'rif_resistance_rate',
              'results_hiv_not_suppressed',
              'device_calibration_report',
            ],
            permissions: [
              {
                module: 'device',
                activity: 'edit',
              },
              {
                module: 'result',
                activity: 'edit',
              },
              {
                module: 'site',
                activity: 'edit',
              },
              {
                module: 'assay',
                activity: 'view',
              },
              {
                module: 'browse',
                activity: 'view',
              },
            ],
          },
          {
            name: 'Lab Admin',
            permissions: [
              {
                module: 'device',
                activity: 'edit',
              },
              {
                module: 'result',
                activity: 'edit',
              },
              {
                module: 'site',
                activity: 'edit',
              },
              {
                module: 'assay',
                activity: 'view',
              },
              {
                module: 'browse',
                activity: 'view',
              },
              {
                module: 'dashboard',
                activity: 'view',
              },
              {
                module: 'dashboard',
                activity: 'summary',
              },
            ],
          }
        ),
        {
          name: 'Lab Admin',
          reports: [
            'critical_errors_by_device',
            'device_calibration_report',
            'mtb_detected_rr_detected',
            'results_hiv_not_suppressed',
            'rif_resistance_rate',
          ],
          permissions: [
            {
              module: 'assay',
              activity: 'view',
            },
            {
              module: 'browse',
              activity: 'view',
            },
            {
              module: 'dashboard',
              activity: 'summary',
            },
            {
              module: 'dashboard',
              activity: 'view',
            },
            {
              module: 'device',
              activity: 'edit',
            },
            {
              module: 'result',
              activity: 'edit',
            },
            {
              module: 'site',
              activity: 'edit',
            },
          ],
        }
      )

      assert.deepEqual(
        mergeJobFunctions(
          {
            name: 'Lab Admin',
            reports: [
              'mtb_detected_rr_detected',
              'critical_errors_by_device',
              'rif_resistance_rate',
              'results_hiv_not_suppressed',
              'device_calibration_report',
            ],
          },
          {
            name: 'Lab Admin',
          }
        ),
        {
          name: 'Lab Admin',
          reports: [
            'critical_errors_by_device',
            'device_calibration_report',
            'mtb_detected_rr_detected',
            'results_hiv_not_suppressed',
            'rif_resistance_rate',
          ],
        }
      )
      assert.deepEqual(
        mergeJobFunctions(admin, {
          permissions: [
            {
              module: 'assay',
              activity: 'view',
            },
          ],
        }),
        {
          name: 'admin',
          permissions: [
            { module: 'account', activity: 'view' },
            {
              module: 'assay',
              activity: 'view',
            },
            { module: 'device', activity: 'view' },
            { module: 'inventory', activity: 'view' },
            { module: 'issue', activity: 'view' },
            { module: 'report', activity: 'view' },
            { module: 'task', activity: 'view' },
          ],
        }
      )
    })
  })
})
