const test = require('tape')
const Kefir = require('kefir')
const spatial = require('../src/spatial')
const obj = (k, p) => {let o = {}; o[k] = p; return o}
const truthy = x => !!x

// returns a fn (String input) -> Kefir Stream
// resulting gstream will contain a single value - a place in the world
// if input is not recongized, resulting stream will have single value `undefined`
function commands (sp, locName) {

  let streamFromNodeCb = (fn, ...args) =>
      Kefir.fromNodeCallback(cb => fn.apply(this, args.concat(cb)))

  let findPlace = (pl) => streamFromNodeCb(sp.find, pl)

  let genericCommands = [
    { 'look' :  () =>
      findPlace(locName)
    },
    { 'describe: {description}': o =>
      streamFromNodeCb(sp.describe, locName, o.description)
    },
    {
      "you can '{command}' to {placeName}": o =>
        streamFromNodeCb(sp.link, locName, o.placeName, o.command)
    },
    {
      "you cannot '{command}'": o =>
        streamFromNodeCb(sp.unlink, locName, o.command)
    },
  ]

  let edgeToTextCommand = (e) => obj(e.command, () => findPlace(e.goesTo))
  let placeToTextCommands = (pl) => pl ? pl.edges.map(edgeToTextCommand) : []
  let locationSpecificCommandS = findPlace(locName).map(placeToTextCommands)
  let commandsHereS = locationSpecificCommandS.map(lcs => lcs.concat(genericCommands))

  // return a stream
  return commandsHereS.map(require('text-commander')).map(commander => {
    // return a fn (input) => that handles null values
    return i => {
      let r = commander(i)
      return r ? r : Kefir.constant(undefined)
    }
  })
}

function inputReactionS (inS, sp, locName) {
  return commands(sp, locName).flatMap(cmdr => inS.flatMap(cmdr))
}

function currentLocationUpdateS (sp, locName) {
  let spaceS = Kefir.fromEvents(sp.createReadStream({live:true}), 'data')
  return spaceS.filter(truthy).filter(p => p.name===locName)
}

// returns perceptionS
function Perceiver (inS, sp, locName) {
  //let perceptionS = Kefir.pool()
  let irS = inputReactionS(inS, sp, locName)
  let clS = currentLocationUpdateS(sp, locName)
//  //currentLocUpdateS.flatMap(l => comm)
//  // get the command parsing function at this place, and
//  // run user input through it, to produce a stream of perceived places
//  // the Perceiver moves itself - thats what causes this recursive loopiness
  return Kefir.merge([irS, clS]).debounce(10) // HACK - should really skipDuplicatesDeep() here
}





// testing stuff -----------------------------------------------------------
let inputS = Kefir.sequentially(25, [
  'look',
  'describe: a book sits on a pedestal',
  'look',
  "you can 'fall through the book' to a warm island dock",
  'fall through the book',
  'look',
  'describe: the water is warm',
  'look',
  "you can 'jump into the water' to some water",
  "jump into the water",
])

let kv = require('../src/load-kv')()
let space = spatial(kv)
let perceptionS = Perceiver(inputS, space, 'the library')


inputS
  .log('INPUT')
perceptionS
  .map(p => p ? p.name : undefined)
  .log('PERCEIVED')
