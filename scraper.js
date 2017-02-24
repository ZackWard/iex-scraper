var request = require('request');
var mongodb = require('mongodb');

let mongoUrl = "mongodb://localhost:27017/iex_data";
let iexApiUrl = "https://api.iextrading.com/1.0/tops/last";

mongodb.MongoClient.connect(mongoUrl, function (err, db) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    request(iexApiUrl, function (error, response, body) {
        if (error) {
            console.log(error);
            process.exit(1);
        }

        var scrapeTime = new Date();

        var quotes = JSON.parse(body).map(quote => {
            return {
                symbol: quote.symbol,
                price: quote.price,
                size: quote.size,
                time: quote.time > 0 ? new Date(quote.time) : 0,
                scraped: scrapeTime
            };
        });

        db.collection('quotes').insertMany(quotes, function (err, r) {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            console.log("Inserted " + r.insertedCount + " quotes");
            db.close();
        });

    });
});