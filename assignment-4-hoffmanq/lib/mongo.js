/*
 * Module for working with a MongoDB connection.
 */

const { MongoClient } = require('mongodb')

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER || 'user'
const mongoPassword = process.env.MONGO_PASSWORD || 'password'
const mongoDbName = 'database'
const mongoAuthDbName = process.env.MONGO_AUTH_DB || mongoDbName

const mongoUrl = `mongodb://user:password@localhost:27017/database`

let _db = null
let _closeDbConnection = null

exports.connectToDb = async function () {
    try {
        const client = await MongoClient.connect(mongoUrl);
        _db = client.db(mongoDbName);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
}

exports.getDb = function () {
    return _db
}

exports.closeDbConnection = function (callback) {
    _closeDbConnection(callback)
}
