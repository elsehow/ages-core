let spatial = require('../src/spatial')
let loadKv = require('../src/load-kv')
let spaces = spatial(loadKv())
// we need to be in some place, to start.
// we can cheat and call it 'origin' to start
// or just 'the library'
spaces.describe('the library', 'a book sits on a pedestal', (err, res) => {
  console.log(res)
})
