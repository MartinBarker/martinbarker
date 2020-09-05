const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://dbUser:dbUserPassword@cluster0.qotrh.gcp.mongodb.net/node-blog?retryWrites=true&w=majority";

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( url,  { useUnifiedTopology: true, useNewUrlParser: true }, function( err, client ) {
      _db  = client.db('node-blog');
      return callback( err );
    } );
  },

  getDb: function() {
    //console.log('returning _db = ', _db)
    return _db;
  }
};
