'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");

var dns = require('dns');
var url = require('url');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);

const schema = new mongoose.Schema({ original_url: String, short_url: Number });

const ShortUrl = mongoose.model('ShortUrl', schema);

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.post(
  "/api/shorturl/new", 
  (req, res) => dns.lookup(
    url.parse(req.body.url).hostname, 
    {all: true}, 
    async error => {
      if(error !== null) {
        res.json({error: 'invalid URL'});
        return;
      }

      const documentCount = await ShortUrl.countDocuments({}).exec();

      const shortUrl = new ShortUrl({
        original_url: req.body.url,
        short_url: documentCount + 1
      });

      shortUrl.save((error, data) => {
        if(error) console.log(error);

        res.json({original_url: data.original_url, short_url: documentCount + 1});
      });
    }
  )
);

app.get(
  '/api/shorturl/:id',
  (req, res) => ShortUrl.findOne(
    {short_url: req.params.id},
    (error, data) => {
      if(error) res.json(error);

      res.redirect(data.original_url);
    }
  )
);


app.listen(port, function () {
  console.log('Node.js listening ...');
});