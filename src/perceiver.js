/*
  perceiver.js
  elsehow

  Exposes a function (inS, sp, startLoc) => {}

  Takes an input stream (of strings, commands), a space (from spatial.js), and a starting location (a string, the name of a place).

  Returns a stream `perceptionS`, where each object in the stream is a perceive place in the space instance.
*/

const Kefir = require('kefir')
const spatial = require('./spatial')
const commandFnS = require('./commands')
const streamAndEmitF = require('./stream-and-emitF')
// returns perceptionS stream of perceived things
function perceiver (inS, sp, locN) {

  let [locS, updateLocF] = streamAndEmitF()

  let curLocS = locS.toProperty(_ => {
    return { name: locN }
  })

  let currentCommandS = curLocS.flatMap(l => {
    //return updatesHereS(l).flatMap(p => commandFnS(sp, p.name))
    return commandFnS(sp, l.name)
  })

  return Kefir.zip([inS, currentCommandS]).flatMapLatest(([input, cmdr]) => {
    let rxS = cmdr(input)
    rxS.onValue(updateLocF)
    return rxS
  })

}

module.exports = perceiver
