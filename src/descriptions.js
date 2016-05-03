'use strict'
function space (s) {
  function commands () {
    if (s.edges && s.edges.length) {
      let commands = s.edges.map((e, i) => {
        let cmd = e.command
        if (i == s.edges.length-1)
          return `*${cmd}*.`
        return `*${cmd}*, \nor `
      })
      return '\n\nFrom here, you can ' +
        commands
    }
    return ''
  }
  return s.name + '\n' + s.description + commands()
}

module.exports = {
  space: space,
}
