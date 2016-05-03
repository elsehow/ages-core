'use strict'
let obj = (k, p) => {let o = {}; o[k] = p; return o}
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
let movementCb = (err, res) => {
  //console.log('calling back on', err, res) // TODO debug
  movementEmitF(res) 
}
let moveTo = (place) => {
  //console.log('moving to', place) // TODO debug
  spaces.find(place, movementCb) 
}
// spaceS is a stream of updates to places in the world.
let spaceS = Kefir.fromEvents(readStream, 'data')
// updates to places we're currently in.
let updateToCurLocS = spaceS.combine(movementS, sameName)
//movementS.log('movement') // TODO debug
// currentLocS is a stream of updates to the place we're currently in
// they come either from having moved,
// or from modifications to our surroundings.
let currentLocS = spaceS.filterBy(updateToCurLocS).merge(movementS)
let edgeToTextCommand = (e) => obj(e.command, () => moveTo(e.goesTo))
let placeToTextCommands = (pl) => pl.edges.map(edgeToTextCommand)
let currentMovementCommandS = currentLocS.map(placeToTextCommands)
// produce currentCommandS - a stream of all the commands we can issue
// these update along with currentLocS, since the commands available to us
// are a function of where we are in the world.
// at any given time.
let currentCommandS = currentLocS
    .map(l => placeToTextCommands(l).concat(globalCommands(spaces, l)))

function globalCommands (sp, curLoc) {
  console.log('making commands for', curLoc) //TODO debug
  // TODO need a way to error
  let cb = (err, res) => {
    if (err)
      console.log('ERR!', err)
  }
  return [
    //{ 'look' :  _ => sp.find(curLoc, movementCb) },
    { 'describe: {description}': o => sp.describe(curLoc.name, o.description, cb) },
    { "you can '{command}' to {place}": o => sp.link(curLoc.name, o.place, o.command, cb) },
    { "you cannot '{command}'": o => sp.unlink(curLoc.name, o.command, cb) },
    //{ '': cb },
  ]
}

// TODO filter inputS through commands to produce side-effects
let applyToInput = (f) => process.stdin.on('data', d => f(d.toString().trim()))
currentCommandS
  .map(require('text-commander')) // feed commands list into text-commander
  .onValue(cmdr => applyToInput(cmdr)) // feed input into text commander

// print updates to current location
currentLocS
  .map(descriptions.space)
  .log()




/*
TODO    what to do when the place doesn't exist............
-----------------------------------------------------------
we ought to see a falsey value on `spaces.find()`
i think that `description.space` could handle that
the question is how to deal with the rest of the processing pipeline
*/






// HACK if i have no current location,
// make up the library and set my location to that
// TODO should load my current location from preferences
spaces.describe(
  'the library',
  'a book sits on a pedestal',
  (err, res) => {
    moveTo('the library')
  }
)

// link the library elsewhere
setTimeout( () => {
  spaces.link(
    'the library',
    'a warm island dock',
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
