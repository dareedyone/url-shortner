"use strict";
require("dotenv").config();
var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
const dns = require("dns");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URL);
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
// console.log(process.env.DB_URL);
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

//create schema and model
const Schema = mongoose.Schema;
const UrlSchema = new Schema({
  original_url: String,
  short_url: Number
});
const Url = mongoose.model("Url", UrlSchema);

let globalCount;
Url.countDocuments(function(err, count) {
  globalCount = count;
});

// console.log(globalCount);
app.post("/api/shorturl/new", function(req, res) {
  // res.json(globalCount);
  // console.log(globalCount);
  let url = req.body.url;
  let urlTest = /^https:\/\/www./.test(url);
  // console.log(urlTest);

  //declare done()

  function serveRes(nul, data) {
    console.log(data);
    let { original_url, short_url } = data;
    res.json({ original_url, short_url });
  }

  if (urlTest) {
    let urlObject = new URL(url);
    // Math.round(Math.random() * 1000)
    dns.lookup(urlObject.hostname, (err, address, family) => {
      if (err) {
        res.json({ error: "invalid Hostname" }); 
      } else {
        let createAndSaveUrl = function(done) {
          let NewUrl = new Url({
            original_url: urlObject.origin,
            short_url: globalCount + 1
          });
          // res.json({ staus: urlObject.origin });

          NewUrl.save(function(err, data) {
            if (err) console.log(err);
            done(null, data);
          });
        };
        createAndSaveUrl(serveRes);
      }
    });
  } else {
    let invalidObj = { error: "invalid URL" };
    res.json(invalidObj);
  }
});

//to check url
app.get("/api/shorturl/:id", function(req, res) {
  //                                              // res.send(req.params.id);
  Url.findOne({ short_url: req.params.id }, function(err, url) {
    if (url !== null) return res.redirect(url.original_url);
    res.json({ error: "No short url found for given input" });
    // res.json(url);
  });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
