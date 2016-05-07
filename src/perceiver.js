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
