'use strict'
const Kefir = require('kefir')
const EventEmitter = require('events').EventEmitter
const streamAndEmitter = (em, ev) => {
  return [
    (x) => em.emit(ev, x),
    Kefir.fromEvents(em, ev)
  ]
}
const coreCommands = (outF) => {
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

// TODO in the future, will take /at least/ a hyperkv-like object, and a starting location
// TODO in the further future, probably an identity and a relay server, as well
function ages () {

  let emitter = new EventEmitter()
  let [inputF, inputS] = streamAndEmitter(emitter, 'input')
  let [outputF, outputS] = streamAndEmitter(emitter, 'output')
  let cmdr = require('text-commander')(coreCommands(outputF))

  let em2 = new EventEmitter()
  inputS
    .map(cmdr) // warning - side-effecty
    .filter(x => x==false)
    .onValue(() => {
      outputF("I didn't understand that, sorry.")
    })

  return {
    inputF: inputF,
    outputS: outputS,
  }
}


module.exports = ages
