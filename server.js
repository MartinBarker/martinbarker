//setup express app
const express = require('express');
const app = express();
var router = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

//port and hosting info
const port = 8080;

//connect to mongodb server
var mongoUtil = require( './static/assets/js/mongoUtils' );

mongoUtil.connectToServer( function( err, client ) {
  if (err) console.log('err connecting to mongodb');
} );

//set cors for all routes
app.use('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

//Loads the handlebars module
const handlebars = require('express-handlebars');

//Sets our app to use the handlebars engine
app.set('view engine', 'handlebars');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

//Sets handlebars configurations (we will go through them later on)
app.engine('handlebars', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    helpers: {
        'ifEquals': function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        },
        'ifActiveId': function (arg1, arg2, options) {
            console.log('ifActiveId: options=',options)
            //return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
            return true;
        }
    },
}));

//Tells app to use '/public' folder for static files
app.use(express.static('public'))

//connect all routes
const routes = require('./routes');
app.use('/', routes);

//use this folder for static files
app.use('/static/', express.static(__dirname + '/static/'));

//render and startup server
app.listen(port, () => console.log(`App listening to port ${port}`));