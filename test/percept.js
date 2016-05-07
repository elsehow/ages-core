const test = require('tape')
const Kefir = require('kefir')
const spatial = require('../src/spatial')
const truthy = x => !!x
const not = f => x => !f(x)
const deepEqual = require('deep-equal')
const descriptions = require('../src/descriptions')
const commandFnS = require('../src/commands')
const streamAndEmitF = require('../src/stream-and-emitF')

const skipDuplicatesDeep = (s) => {
  let x;
  return s.filter(v => {
    let f = !deepEqual(x,v)
    x = v
    return f
  })
}


function perceiverAtPlace (inS, sp, locN) {

  let [locS, updateLocF] = streamAndEmitF()

  let curLocS = locS.toProperty(_ => {
    return { name: locN }
  })

  let currentCommandS = curLocS.flatMap(l => {
    return commandFnS(sp, l.name)
  })

  return Kefir.zip([inS, currentCommandS]).flatMapConcat(([input, cmdr]) => {
    let upS = cmdr(input)
    upS.onValue(l => {
      updateLocF(l)
    })
    return upS
  })

}







// test stuff ------------------------------------------------
//const emitterFromStream = (s, evN) => {
//  let EventEmitter = require('events').EventEmitter
//  let emitter = new EventEmitter()
//  s.onValue(v => emitter.emit(evN, v))
//  return emitter
//}

let inputS = Kefir.sequentially(100, [
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
//let emitter = emitterFromStream(inputS, 'input')
let perceptionS = perceiverAtPlace(inputS, space, 'a quiet library')
//let perceptionS = inputS.flatMap(Perceiver(space, 'a quiet library'))

inputS
  //.onValue(dummyCb)
  .log('INPUT')
perceptionS
  //.map(descriptions.place)
  //.onValue(dummyCb)
  .log('PERCEIVED')

