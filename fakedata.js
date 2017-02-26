var request = require('request');
var mongodb = require('mongodb');

let mongoUrl = "mongodb://localhost:27017/iex_data";
let iexApiUrl = "https://api.iextrading.com/1.0/tops/last";

console.log("Faking " + process.argv[2] + " days of IEX data.");

function closeAndExit(error, db = false) {
    console.log(error);
    if (db) {
        db.close();
    }
    process.exit(1);
}

function generatePriceVariation(price, variationRange) {
    let percentageChange = (variationRange * Math.random()) / 100 * (Math.random() > 0.5 ? 1 : -1);
    let priceChange = price * percentageChange;
    return Number(priceChange.toFixed(2));
}

function fakeData(db, stock, days = 30) {

    // Bail out early if the stock isn't active
    if (stock.time == 0) {
        return [];
    }

    let variationRange = 20;

    days = days > 0 ? days : 30;
    console.log("Faking " + days + " days worth of data for stock: " + stock.symbol);

    let fakeTime = new Date();
    
    let startPrice = Number(stock.price);

    let fakeQuotes = [];

    let currentPrice = startPrice;

    for (let i = 1; i <= days; i++) {
        currentPrice += generatePriceVariation(currentPrice, variationRange);
        let daysInMS = i * 24 * 60 * 60 * 1000;
        fakeQuotes.push({
            symbol: stock.symbol,
            price: currentPrice > 0 ? Number(currentPrice.toFixed(2)) : 0,
            size: 100,
            time: new Date((stock.time.getTime()) - daysInMS),
            faked: fakeTime
        });
    }
    console.log(fakeQuotes);
    return fakeQuotes;
}

mongodb.MongoClient.connect(mongoUrl, function (err, db) {
    if (err) {
        closeAndExit(err, db);
    }

    // Assume that we only have 1 day of data in MongoDB, so each document should be a unique stock symbol
    var stocks = 0;
    var fakeQuotes = [];
    db.collection('quotes').find({}).forEach(function (doc) {
        stocks++;
        fakeQuotes = fakeQuotes.concat(fakeData(db, doc, process.argv[2]));
    }, function (err) {
        if (err) {
            closeAndExit(err, db);
        }
        db.collection('quotes').insertMany(fakeQuotes, function (err, result) {
            if (err) {
                closeAndExit(err, db);
            }
            console.log("Created and inserted " + result.insertedCount + " fake historical stock quotes.");
            db.close();
        });
    });
});