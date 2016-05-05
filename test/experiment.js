'use strict'
let obj = (k, p) => {let o = {}; o[k] = p; return o}
let truthy = x => !!x
let sameName = (place1, place2) => place1.name === place2.name
let streamAndEmitF = require('../src/stream-and-emitF')
let EventEmitter = require('events').EventEmitter
let Kefir = require('kefir')
let spatial = require('../src/spatial')
let descriptions = require('../src/descriptions')
let kv = require('../src/load-kv')()
let spaces = spatial(kv)
let readStream = spaces.createReadStream({ live: true })
let spaceS = Kefir.fromEvents(readStream, 'data')

function Perceiver (inputS, spaceS, startingLocation) {
  // TODO could make a readstream starting
  // at the last place i've stored in the log
  let [movementS, movementEmitF] = streamAndEmitF()
  let movementCb = (err, res) => {
    console.log('MOVEMENT CB', err, res) // TODO debug
    movementEmitF(res)
  }
  let moveTo = (place) => spaces.find(place, movementCb)
  moveTo(startingLocation)
  let updateToCurLocS = spaceS.combine(movementS.filter(truthy), sameName)
  let currentLocS = spaceS.filterBy(updateToCurLocS).merge(movementS)
  //movementS.log('movement') // TODO debug
  // currentLocS is a stream of updates to the place we're currently in
  // they come either from having moved,
  // or from modifications to our surroundings.
  let edgeToTextCommand = (e) => obj(e.command, () => moveTo(e.goesTo))
  let placeToTextCommands = (pl) => pl.edges.map(edgeToTextCommand)
  let commandsAt = (loc) => placeToTextCommands(loc).concat(globalCommands(spaces, loc))
  let currentCommandS = currentLocS.map(commandsAt).map(require('text-commander'))
  currentLocS.log('seeing loc')
  Kefir.zip([inputS, currentCommandS]).onValue(([input, cmdr]) => cmdr(input))
  return currentLocS
}

// produce currentCommandS - a stream of all the commands we can issue
// these update along with currentLocS, since the commands available to us
// are a function of where we are in the world, at any given time.
// currentCommandS is a list of functions, each one can take some input and produce a side-effect

let inputS = Kefir.merge([
  Kefir.later(100, 'describe: a book sits on a pedestal'),
  Kefir.later(200, 'you can fall through the book to a warm island dock'),
  Kefir.later(300, 'fall through the book'),
  Kefir.later(400, 'describe: the water is warm'),
  Kefir.later(500, "you can 'jump into the water' to some water"),
  Kefir.later(600, "jump into the water"),
])

let perceptionS = Perceiver(inputS, spaceS, 'the library') 
// print updates to current location
perceptionS.map(descriptions.space).log()
inputS.log('INPUT') // TODO debug



/*

TODO    what happens when a command isnt recognized?
            (this could be a feature of text-commander...easily)

TODO    what to do when the place doesn't exist............
-----------------------------------------------------------
we ought to see a falsey value on `spaces.find()`
i think that `description.space` could handle that
the question is how to deal with the rest of the processing pipeline
*/

function globalCommands (sp, curLoc) {
  //console.log('making commands for', curLoc) //TODO debug
  // TODO need a way to error
  let cb = (err, res) => {
      if (err)
        console.log('ERR!', err)
    else
      console.log('RES!', res)
  }
  return [
    //{ 'look' :  _ => sp.find(curLoc, movementCb) },
    { 'describe: {description}': o => sp.describe(curLoc.name, o.description, cb) },
    { "you can '{command}' to {place}": o => sp.link(curLoc.name, o.place, o.command, cb) },
    { "you cannot '{command}'": o => sp.unlink(curLoc.name, o.command, cb) },
    //{ '': cb }, // TODO need a way to catch commands we dont know about
  ]
}


