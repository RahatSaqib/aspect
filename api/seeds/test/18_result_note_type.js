module.exports = require('../utils').seed(seed, __filename)

const resultNoteType = require('../fixtures/ResultNoteType.json')

async function seed(knex) {
  const [{ countResultNoteType }] = await knex('ResultNoteType').count(
    '* as  countResultNoteType '
  )
  if (resultNoteType.length > countResultNoteType)
    await knex('ResultNoteType').insert(resultNoteType)
}
