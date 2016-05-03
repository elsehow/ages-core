'use strict'
let sameName = (place1, place2) => place1.name === place2.name
let streamAndEmitF = require('../src/stream-and-emitF')
let EventEmitter = require('events').EventEmitter
let Kefir = require('kefir')
let spatial = require('../src/spatial')
let descriptions = require('../src/descriptions')
let kv = require('../src/load-kv')()
let spaces = spatial(kv)
// TODO could make a readstream starting
// at the last place i've stored in the log
let readStream = spaces.createReadStream({ live: true })
let [movementS, movementEmitF] = streamAndEmitF()
// spaceS is a stream of updates to places in the world.
let spaceS = Kefir.fromEvents(readStream, 'data')
// updates to places we're currently in.
let updateToCurLocS = spaceS.combine(movementS, sameName)
// currentLocS is a stream of updates to the place we're currently in
// they come either from having moved,
// or from modifications to our surroundings.
let currentLocS = spaceS.filterBy(updateToCurLocS)
// TODO currentCommandS is a stream of commands available to us
// these update along with currentLocS, since the commands available
// to us are a function of where we are in the world.
let currentCommandS = currentLocS.map(s => s.edges)

// print updates to current location
currentLocS
  .map(descriptions.space)
  .log()

// TODO filter inputS through 







// HACK if i have no current location,
// make up the library and set my location to that
// TODO should load my current location from preferences
spaces.describe(
  'the library',
  'a book sits on a pedestal',
  (err, res) => {
    movementEmitF(res)
  }
)

// link the library elsewhere
setTimeout( () => {
  spaces.link(
    'the library',
    'a warm islamd dock',
    'fall through the book',
    (err, res) => {
    })
}, 500)

// describe a new place
setTimeout( () => {
  spaces.describe(
    'a warm island dock',
    'the water is warm and cool',
    (err, res) => {
    })
}, 1000)
