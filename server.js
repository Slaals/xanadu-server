var http = require('http');
var express = require('express');
var app = express();

const NodeCouchDb = require('node-couchdb');

// node-couchdb instance talking to external service
const server1 = new NodeCouchDb({
  host: '192.168.99.100',
  protocol: 'http',
  port: 8001
});

const server2 = new NodeCouchDb({
  host: '192.168.99.100',
  protocol: 'http',
  port: 8002
});

const registeredServs = [server1, server2];
for(var s in registeredServs) {
  registeredServs[s].createDatabase('xanadu_reloaded').then(() => {
    console.log('database created in', registeredServs[s]._baseUrl);
  }, (err) => {
    console.log('failed to create database in', registeredServs[s]._baseUrl, err);
  });
}

app.get('/docuverse', function(req, res) {
  var include_docs = true;
  var sync = new Promise(function(resolve, reject) {
    var rows = [];
    var sDone = [];
    var key = req.query.key || '_all_docs';
    for(var s in registeredServs) {
      registeredServs[s].get('xanadu_reloaded', key, { include_docs }).then((data, headers, status) => {
        var doc = data.data.rows || data.data;
        rows.push(doc);
        sDone.push(true);
        if(sDone.length === registeredServs.length) {
          resolve(rows);
        }
      }, (err) => {
        sDone.push(true);
        if(sDone.length === registeredServs.length) {
          resolve(rows);
        }
      });
    }
  });

  sync.then((rows) => {
    res.send(rows);
  }, (err) => {
    console.log('failed to get the docuverse', err);
  });
});

var server = http.createServer(app);

server.listen(8080, function(){
    console.log("Server listening on: http://localhost:%s", 8080);
});
