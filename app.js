// Load modules
var http    = require('http');
var request = require('request')
var express = require('express')
var path    = require('path');
var mysql   = require('mysql');
var urlParse     = require('url');
// Create connection
var connection = mysql.createConnection({
  host     : 'localhost',
  port     : '3306',
  user     : 'nodejs',
  password : 'nodejs',
  database : 'node_checker'
});

var app     = express();

function dbQuery(query){
  connection.query(query, function (error, results, fields) {
    console.log('Query to DB');
    console.log('Query => ' + query);
    var count;
    if (error)
    {
      connection.end();
      console.error('DB Error:' + error);
      throw error;
    } else {
      count = results.length;
      console.log('Item found ' + count);
      return results;
    }
  });
}

function prepareUrl(url){
  var rUrl = new Array;
  if((~url.indexOf("http://")) || (~url.indexOf("https://")))
  {
    console.log('Url correct');
  } else {
    url = 'http://' + url;
    rUrl['warning'] = "url protocol not found set HTTP";
  }
  var returnUrl = urlParse.parse(url);
  rUrl['hostname'] = returnUrl.hostname;
  rUrl['protocol'] = returnUrl.protocol;
  rUrl['port'] = returnUrl.port;
  if(rUrl['hostname'].length <=3) rUrl.error = "invalid url";
  if(rUrl.port == null)
  {
    rUrl['full'] = rUrl['protocol'] + '//' + rUrl['hostname'];
  } else {
    rUrl['full'] = rUrl['protocol'] + '//' + rUrl['hostname'] + ':' + rUrl['port'];
  }
  console.log('Url: ' + rUrl.full);
  return rUrl;
}

function checkUrl(url, req, res){
      var parsedUrl = prepareUrl(url);
      if(parsedUrl.error) console.error(parsedUrl.error);
      if(parsedUrl.warning) console.log(parsedUrl.warning);
      //Query to DB
      dbQuery('SELECT * FROM urls WHERE url = "' + parsedUrl.hostname + '" and protocol = "' + parsedUrl.protocol +'" LIMIT 1');

      var serverReq = new Promise(function (resolve, reject) {

        request({ url: parsedUrl.full, method: 'GET' }, function(err, res, body) {

          if (err)
          {
            reject(false, err);
            console.log(err);
          } else {

            resolve(res.statusCode);
          }
        });
      });
      return serverReq.then(
        result =>
        {
          res.json({'url': parsedUrl.full, 'res': result});
        }, error => {
          res.json({'url': parsedUrl.full, 'error': true});
        });
}

app.get('/test/', function (req, res) {
  console.log('=============================================>');
  checkUrl(req.query.url, req, res);
});


// Run web-server
app.listen(3000, function () {
  console.log('Аpp is listening on port 3000!')
})
