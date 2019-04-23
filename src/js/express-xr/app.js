const os = require('os')
const path = require('path')

const express = require('express')
const app = express()
const http = require('http').Server(app)

const portNumber = 1234

class XRServer {
  constructor ({ store }) {
    // app.use('/', express.static(path.join(__dirname, 'dist')))

    app.get('/', function (req, res) {
      res.sendFile(__dirname + '/src/index.html')
    })

    // app.get('/getStore', (req, res) => {
    //   const store = $r.store.getState()
    //   res.json({ store: store })
    // })

    http.on('error', err => {
      that.emit('error', err)
    })

    http.listen(portNumber, function() {
      console.log('running server')
      // let hostname = os.hostname()
      // console.log('http://' + hostname + ':' + portNumber)
      // require('dns').lookup(hostname, function (err, add, fam) {
      //   console.log('http://' + add + ':' + portNumber)
      // })
    })
  }
}

module.exports = XRServer
