module.exports = require('../utils').seed(seed, __filename)

const resultNoteType = require('../fixtures/ResultNoteType.json')

async function seed(knex) {
  await knex('ResultNoteType').insert(resultNoteType)
}
