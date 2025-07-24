const chai = require('chai')

const { expect } = chai
const { knex } = require('../../src/db')
const { updateConsumableSitesBatch } = require('../../src/inventory/common/db')
const { insertSite } = require('../../src/site/common/db')

// Helper functions for creating test data
async function createTestSite(knex, siteData) {
  const [siteId] = await insertSite(knex, {
    name: siteData.name || 'Test Site',
    shortName: siteData.shortName || 'Test',
    externalId: siteData.externalId || 'TEST001',
    siteTypeId: siteData.siteTypeId || 1,
    sampleRegistrationAllowed: true,
    ...siteData,
  })
  return { id: siteId, ...siteData }
}

async function createTestConsumable(knex, consumableData) {
  const timestamp = Date.now()
  const uniqueId = `CONS${timestamp}`
  const [consumableId] = await knex('Consumable').insert({
    name: consumableData.name || 'Test Consumable',
    externalId: consumableData.externalId || uniqueId,
    unit: consumableData.unit || 1,
    i18nKey: consumableData.i18nKey || `test.i18nKey.${timestamp}`,
    ...consumableData,
  })
  return { id: consumableId, ...consumableData }
}

describe('updateConsumableSitesBatch', () => {
  it('should update multiple sites for a single consumable', async () => {
    // Create test sites
    const site1 = await createTestSite(knex, { name: 'Test Site 1' })
    const site2 = await createTestSite(knex, { name: 'Test Site 2' })
    const site3 = await createTestSite(knex, { name: 'Test Site 3' })

    // Create test consumable
    const consumable = await createTestConsumable(knex, { name: 'Test Consumable' })

    // Initially, no sites should have this consumable
    const initialSites = await knex('SiteConsumable').where({ consumableId: consumable.id }).select('siteId')
    expect(initialSites).to.have.length(0)

    // Update to assign consumable to sites 1 and 2
    await updateConsumableSitesBatch(knex, consumable.id, {
      siteIds: [site1.id, site2.id],
    })

    // Check that sites 1 and 2 now have the consumable
    const updatedSites = await knex('SiteConsumable')
      .where({ consumableId: consumable.id })
      .select('siteId')
      .orderBy('siteId')

    expect(updatedSites).to.have.length(2)
    expect(updatedSites.map(s => s.siteId)).to.deep.equal([site1.id, site2.id])

    // Update to assign consumable to sites 2 and 3 (removing site 1, adding site 3)
    await updateConsumableSitesBatch(knex, consumable.id, {
      siteIds: [site2.id, site3.id],
    })

    // Check that sites 2 and 3 now have the consumable, site 1 does not
    const finalSites = await knex('SiteConsumable')
      .where({ consumableId: consumable.id })
      .select('siteId')
      .orderBy('siteId')

    expect(finalSites).to.have.length(2)
    expect(finalSites.map(s => s.siteId)).to.deep.equal([site2.id, site3.id])

    // Verify site 1 no longer has the consumable
    const site1Consumables = await knex('SiteConsumable').where({ siteId: site1.id, consumableId: consumable.id })
    expect(site1Consumables).to.have.length(0)
  })

  it('should handle empty siteIds array', async () => {
    const site = await createTestSite(knex, { name: 'Test Site' })
    const consumable = await createTestConsumable(knex, { name: 'Test Consumable' })

    // Initially assign consumable to site
    await knex('SiteConsumable').insert({
      siteId: site.id,
      consumableId: consumable.id,
    })

    // Update to remove all sites
    await updateConsumableSitesBatch(knex, consumable.id, { siteIds: [] })

    // Check that no sites have this consumable
    const remainingSites = await knex('SiteConsumable').where({ consumableId: consumable.id })
    expect(remainingSites).to.have.length(0)
  })

  it('should prevent removal when inventory exists', async () => {
    const site = await createTestSite(knex, { name: 'Test Site' })
    const consumable = await createTestConsumable(knex, { name: 'Test Consumable' })

    // Assign consumable to site
    await knex('SiteConsumable').insert({
      siteId: site.id,
      consumableId: consumable.id,
    })

    // Create inventory for this consumable at this site
    await knex('InventoryItem').insert({
      siteId: site.id,
      consumableId: consumable.id,
      quantityOnHand: 10,
      lotNumber: 'TEST-LOT-001',
      expiresOn: '2025-12-31',
    })

    // Try to remove the consumable from the site
    try {
      await updateConsumableSitesBatch(knex, consumable.id, { siteIds: [] })
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error.message).to.include('Unable to remove consumable from sites with existing inventory')
    }

    // Verify the consumable is still assigned to the site
    const remainingSites = await knex('SiteConsumable').where({ consumableId: consumable.id })
    expect(remainingSites).to.have.length(1)
    expect(remainingSites[0].siteId).to.equal(site.id)
  })
})
