const MongoClient = require('mongodb').MongoClient;
const url = `mongodb+srv://dbUser:${process.env.mongodbpword}@cluster0.qotrh.gcp.mongodb.net/node-blog?retryWrites=true&w=majority`;

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( url,  { auto_reconnect: true, useUnifiedTopology: true, useNewUrlParser: true }, function( err, client ) {
      console.log('connectToServer() setting _db = ', _db)
      _db  = client.db('node-blog');
      return callback( err );
    } );
  },

  getDb: function() {
    console.log('pgetDb() _db = ', _db)
    return _db;
  }
};
