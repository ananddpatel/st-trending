const app = require('express')()
const MongoClient = require('mongodb').MongoClient;
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
      mongoDB = db
      resolve(db);
      console.log('Connected successfully to mongo');
    }
  );
});

function generateAnalysis(trendingData, upperLimit) {
  const formatted = {};
  const baseDate = new Date(trendingData[0].time).toLocaleDateString();
  const lowerLimitTime = new Date(baseDate + ' ' + '09:30');
  const upperLimitTime = new Date(baseDate + ' ' + upperLimit); // end of day 4:00pm
  // const upperLimitTime = upperLimit; // 1:00pm

  const isBad = itemData => itemData.Open > itemData.Last;

  trendingData.forEach(item => {
    const symbols = Object.keys(item.trending);
    symbols.forEach(s => {
      const symInFormattedData = formatted[s];
      const priceData = {
        sym: s,
        time: new Date(item.time).toLocaleString(),
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

app.get('/trending', (req, res) => {
  const date = req.query.date
    ? req.query.date
    : new Date().toLocaleString().split(' ')[0];
  const upperLimitTime = req.query.upperLimitTime
    ? req.query.upperLimitTime
    : '16:00';

  return mongoPromise
    .then(db => {
      db.collection('trending')
        .findOne({ _id: date })
        .then(items => {
          if (!items) {
            return res.send([]);
          }
          const analysis = generateAnalysis(items.value, upperLimitTime);
          return res.send(analysis);
        })
        .catch(err => res.send({ error: JSON.stringify(err) }));
    })
    .catch(err => {
      return res.send({ error: JSON.stringify(err) });
    });
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
