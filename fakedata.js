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

function fakeData(db, stock, days = 30) {

    let totalChangeVariation = 20;

    days = days > 0 ? days : 30;
    console.log("Faking " + days + " days worth of data for stock: " + stock.symbol);
    let totalChange = Math.random() * totalChangeVariation;
    totalChange = totalChange * (Math.random() > 0.5 ? 1 : -1);

    let startPrice = Number(stock.price);
    let endPrice = startPrice * (1 + (totalChange / 100));
    let totalPriceDifference = endPrice - startPrice;
    let dailyPriceDifference = priceDifference / days;

    let fakeQuotes = [];
    for (let i = 0; i < days; i++) {
        fakeQuotes.push({
            symbol: stock.symbol,
            price: 0,
            size: 0,
            time: 0,
            faked: 0
        });
    }

    console.log("Changing total value by " + totalChange.toFixed(2) + "%, from " + startPrice + " to " + endPrice.toFixed(2) + " a difference of $" + totalPriceDifference);
}

mongodb.MongoClient.connect(mongoUrl, function (err, db) {
    if (err) {
        closeAndExit(err, db);
    }

    // Assume that we only have 1 day of data in MongoDB, so each document should be a unique stock symbol
    var stocks = 0;
    db.collection('quotes').find({}).forEach(function (doc) {
        fakeData(db, doc, process.argv[2]);
    }, function (err) {
        if (err) {
            closeAndExit(err, db);
        }
        console.log("Finished! Faked data for " + stocks + " stocks.");
        db.close();
    });
});