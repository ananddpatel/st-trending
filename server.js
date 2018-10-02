const dotenv = require("dotenv");
dotenv.config();
console.log(process.env.dbname)
const express = require('express');
const axios = require('axios');
const MongoClient = require('mongodb').MongoClient;
const bodyparser = require('body-parser');

const app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// time is 4 hrs ahead

app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html

let mongoDB;
const mongoPromise = new Promise((resolve, reject) => {
  if (mongoDB) {
    resolve(mongoDB);
  }
  MongoClient.connect(
    process.env.mongourl + process.env.dbname,
    { useNewUrlParser: true },
    (err, client) => {
      if (err) {
        reject(err);
        return;
      }
      const db = client.db(process.env.dbname);
      mongoDB = db;
      resolve(db);
      console.log('Connected successfully to mongo');
    }
  );
});

function generateAnalysis(trendingData, lowerLimit, upperLimit) {
  const formatted = {};
  const baseDate = new Date(trendingData[0].time).toLocaleDateString();
  // const lowerLimitTime = new Date(baseDate + ' ' + '09:30');
  const lowerLimitTime = new Date(baseDate + ' ' + lowerLimit);
  const upperLimitTime = new Date(baseDate + ' ' + upperLimit); // end of day 4:00pm
  // const upperLimitTime = upperLimit; // 1:00pm
  const isBad = itemData => itemData.Open > itemData.Last;

  trendingData.forEach(item => {
    const symbols = Object.keys(item.trending);
    symbols.forEach(s => {
      const symInFormattedData = formatted[s];
      const priceData = {
        sym: s,
        time: item.time,
        last: item.trending[s].Last,
        open: item.trending[s].Open,
        percentChange:
          100 *
          ((item.trending[s].Last - item.trending[s].Open) /
            item.trending[s].Open)
      };
      const currentTime = new Date(item.time);
      if (currentTime >= lowerLimitTime && currentTime <= upperLimitTime) {
        // if (symInFormattedData && !symInFormattedData.bad) { // checks if starting was bad (open > last)
        if (symInFormattedData) {
          symInFormattedData.prices.push(priceData);
        } else if (!symInFormattedData) {
          const bad = isBad(item.trending[s]);
          formatted[s] = {
            sym: s,
            bad: bad,
            prices: []
          };
          if (!bad) {
            formatted[s].prices.push(priceData);
          }
        }
      }
    });
  });
  return formatted;
}

app.get('/', function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


app.get('/trending', (req, res) => {
  const date = req.query.date
    ? req.query.date
    : new Date().toLocaleString().split(' ')[0];
  const lowerLimitTime = req.query.lowerLimitTime
    ? req.query.lowerLimitTime
    : '09:30'; // 4 hrs ahead, so 13:30 = 9:30 = 9:30pm
  const upperLimitTime = req.query.upperLimitTime
    ? req.query.upperLimitTime
    : '16:30'; // 4 hrs ahead, so 20:30 = 16:30 = 4:30pm

  return mongoPromise
    .then(db => {
      db.collection('trending')
        .findOne({ _id: date })
        .then(items => {
          if (!items) {
            return res.send([]);
          }
          const analysis = generateAnalysis(items.value, lowerLimitTime, upperLimitTime);
          return res.send(analysis);
        })
        .catch(err => res.send({ error: JSON.stringify(err) }));
    })
    .catch(err => {
      return res.send({ error: JSON.stringify(err) });
    });
});

app.post('/delete-records', function (req, res) {
  const date = req.body.date ? req.body.date : null;
  return mongoPromise
    .then(db => {
      db.collection('trending')
        .deleteOne({ _id: date })
        .then(doc => {
          return res.send({ deleted: doc.deletedCount });
        })
        .catch(err => res.send({ error: JSON.stringify(err) }));
    })
    .catch(err => {
      return res.send({ error: JSON.stringify(err) });
    });
});

// listen for requests :)
var listener = app.listen(process.env.PORT || 3001, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
