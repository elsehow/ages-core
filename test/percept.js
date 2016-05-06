const test = require('tape')
const Kefir = require('kefir')
const spatial = require('../src/spatial')
const obj = (k, p) => {let o = {}; o[k] = p; return o}
const truthy = x => !!x
const not = f => x => !f(x)
const deepEqual = require('deep-equal')
const descriptions = require('../src/descriptions')
const skipDuplicatesDeep = (s) => {
  let x;
  return s.filter(v => {
    let f = !deepEqual(x,v)
    x = v
    return f
  })
}

// returns a fn (String input) -> Kefir Stream
// resulting gstream will contain a single value - a place in the world
// if input is not recongized, resulting stream will have single value `undefined`
function commandS (sp, locName) {

  let streamFromNodeCb = (fn, ...args) =>
      Kefir.fromNodeCallback(cb => fn.apply(this, args.concat(cb)))

  let dummyName = (p) => {
    if (!p)
      return { name: locName}
    return p
  }

  let findPlace = (pl) => streamFromNodeCb(sp.find, pl).map(dummyName)

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

  let edgeToCommandFn = (e) => obj(e.command, () => findPlace(e.goesTo))
  let placeToCommandFns = (pl) => pl.edges ? pl.edges.map(edgeToCommandFn) : []
  let locationSpecificCommandS = findPlace(locName).map(placeToCommandFns)
  let commandsHereS = locationSpecificCommandS.map(lcs => lcs.concat(genericCommands))

  // return a stream
  return commandsHereS
    .map(require('text-commander'))
    .map(commander => {
      // return a fn (input) => that handles falsey values
      return i => {
        let r = commander(i)
        return r ? r : Kefir.constantError('I didn\'t understand that')
      }
  })
}


function perceiverAtPlace (inS, sp, locN) {

  function currentLocationUpdateS (plN) {
    let spaceS = Kefir.fromEvents(sp.createReadStream({live:true}), 'data')
    return spaceS.filter(truthy).filter(p => p.name===plN)
  }

  function inputReactionS (plN) {
    return commandS(sp, plN).flatMap(cmdr => inS.flatMap(cmdr))
  }

  function commandFnUpdateS (placeS) {
    return skipDuplicatesDeep(placeS.filter(p => truthy(p.edges))).flatMap(p => {
      return commandS(sp, p.name)
    })
  }

  function perceivedPlaceS (plN) {
    let iRxS = inputReactionS(plN)
    let clS = currentLocationUpdateS(plN)
    return Kefir.merge([iRxS, clS]).debounce(20)
  }

  let pS = perceivedPlaceS(locN)
  let cU = commandFnUpdateS(pS)
  // TODO WAHHH HOW DO I COMBINE THESE THINGS?
  // TODO NEED TO UPDATE INPUTS PROCESSOR WITH NEW COMMANDS....
  return pS
}


// TODO not seeing hte first command
// TODO not seeing resu;ts form `look` either
let inputS = Kefir.sequentially(100, [
  'look',
  'describe: a book sits on a pedestal',
  'look',
  "you can 'fall through the book' to a warm island dock",
  'fall through the book',
  //'look',
  //'describe: the water is warm',
  //'look',
  //"you can 'jump into the water' to some water",
  //"jump into the water",
])

let kv = require('../src/load-kv')()
let space = spatial(kv)
//let emitter = emitterFromStream(inputS, 'input')
//let perceptionS = Perceiver(emitter, 'input', space, 'the library')
let perceptionS = perceiverAtPlace(inputS, space, 'a quiet library')
    //.flatMapConcat(p => perceiverAtPlace(inputS, space, p.name))

inputS
  //.onValue(dummyCb)
  .log('INPUT')
perceptionS
  //.map(descriptions.place)
  //.onValue(dummyCb)
  .log('PERCEIVED')



//// returns perceptionS
//function PerceptionS (inEm, inEv, sp, locName) {
//  inEm.removeAllListeners(inEv)
//  let inS = Kefir.fromEvents(inEm, inEv)
//}
//
//
////  // the Perceiver moves itself - thats what causes this recursive loopiness
//function Perceiver (inEm, inEv, sp, locName) {
//
//  function perceiverAtPlace (p) {
//    return PerceptionS(inEm, inEv, sp, p)
//  }
//
//  return perceiverAtPlace(locName)
//    .filter(truthy)
//    .flatMapConcat(p => perceiverAtPlace(p.name))
//}
//
//
//
//// testing stuff -----------------------------------------------------------
//function emitterFromStream (s, evN) {
//  let EventEmitter = require('events').EventEmitter
//  let emitter = new EventEmitter()
//  s.onValue(v => emitter.emit(evN, v))
//  return emitter
//}
