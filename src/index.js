'use strict'
//ages-specific
const spatial = require('./spatial')
const Kefir = require('kefir')
const EventEmitter = require('events').EventEmitter

// TODO in the future, will take /at least/ a hyperkv-like object, and a starting location
// TODO real database management in the future as wel, with level+configruable db location
// TODO ~/.ages by default i figure
function newKv () {
  let hyperkv = require('hyperkv')
  let hyperlog = require('hyperlog')
  let memdb = require('memdb')
  let log = hyperlog(memdb(), { valueEncoding: 'json' })
  return hyperkv({
    log: log,
    db: memdb(),
  })
}

function streamAndEmitter (em, ev) {
  return [
    (x) => em.emit(ev, x),
    Kefir.fromEvents(em, ev)
  ]
}

function coreCommands (outF) {
  return [
    {"say {something}": ({something}) => {
      outF(`Elsehow says \"${something}.\"`)
    }},
    {"look": () => {
      outF(`Description of the room...`)
    }},
    {":{does}": ({does}) => {
      outF(`Elsehow ${does}`)
    }},
  ]
}

// TODO in the further future, probably an identity and a relay server, as well
function ages () {

  let log = newKv() // TODO manage a db from disk
  let emitter = new EventEmitter()
  let [inputF, inputS] = streamAndEmitter(emitter, 'input')
  let [outputF, outputS] = streamAndEmitter(emitter, 'output')
  let cmdr = require('text-commander')(coreCommands(outputF))

  let em2 = new EventEmitter()
  inputS
    .map(cmdr) // warning - side-effecty
    .filter(x => x==false)
    .map(x => "I didn't understand that, sorry.")
    .onValue(outputF)

  return {
    inputF: inputF,
    outputS: outputS,
  }
}


module.exports = ages
