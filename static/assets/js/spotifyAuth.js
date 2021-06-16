var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
//read josn file of access_token/refresh_token accounts
let spotifyTokensObj = fs.readFileSync('static/assets/json/spotifyTokens.json');
let spotifyTokensJSON = JSON.parse(spotifyTokensObj);

//create object for active sessions the user can use without logging in
let sessions = {}

//
// Authentication Functions
//

//authenticate all sessions
authenticateAllSessions()
async function authenticateAllSessions() {
    for (const [key, value] of Object.entries(spotifyTokensJSON)) {
        authenticateSession(key)
    }
}

//authenticate a session
async function authenticateSession(sessionCredsName) {
    var spotifyApiMartin = await new SpotifyWebApi({
        clientId: 'f98aecb59dfa4336921925b2ea14857c',
        clientSecret: process.env.clientSecret,
        redirectUri: 'http://localhost:8080/callback'
    });

    spotifyApiMartin.setRefreshToken(spotifyTokensJSON[`${sessionCredsName}`].refresh_token);
    const data = await spotifyApiMartin.refreshAccessToken();
    var access_token = data.body['access_token'];
    expires_in = data.body['expires_in'];
    spotifyApiMartin.setAccessToken(access_token);
    console.log('authenticateSession1() The access token has been refreshed!');
    console.log('authenticateSession1() access_token:', access_token);
    console.log('authenticateSession1() expires_in:', expires_in);

    sessions[`${sessionCredsName}`] = spotifyApiMartin;

    setInterval(async () => {
        console.log('keepRefreshingMyCredentials()')
        try {
            const data = await spotifyApiMartin.refreshAccessToken();
            expires_in = data.body['expires_in'];
            const access_token = data.body['access_token'];

            console.log('authenticateSession1() The access token has been refreshed!');
            console.log('authenticateSession1() access_token:', access_token);
            console.log('authenticateSession1() expires_in:', expires_in);

            //spotifyApiMartinCreds.access_token = access_token;
            //spotifyApiMartin.setAccessToken(access_token);
        } catch (err) {
            console.log('eeeer=', err)
        }
    }, expires_in / 2 * 1000);

}

//retrieve session 
async function getSession(dontUseTheseCreds = []) {
    return new Promise(async function (resolve, reject) {
        console.log('getSession() getting first session, no checking')
        for (const [key, value] of Object.entries(sessions)) {
            resolve(value)
        }
    })

}

let albumIds = [];
let albumQueryFinished = false;
async function generatePopularifyData(artistURI) {
    return new Promise(async function (resolve, reject) {
        try{
            let returnObj = {};

            ////////////////////////////////////////////////////
            // Get albums 20 ids at a time
            ////////////////////////////////////////////////////
            
            //make initial request for albums
            let initialAlbums = await getArtistAlbums(artistURI, 0, false)
            total = initialAlbums.total;
            
            //make additional queries if needed
            console.log(`\ngetAllArtistAlbums() Artist has ${total} albums. We have ${initialAlbums.items.length} so far and need to get ${total-(initialAlbums.items.length)} more`);
            let artistAlbumsPromises = [];
            for(var x = 20; x < total; x+=20){
                artistAlbumsPromises.push(await getArtistAlbums(artistURI, x, true))
                //getArtistAlbums(artistURI, x, true) //method2
            }
            
            //complete promises
            let finishedArtistAlbumsPromises = await Promise.all(artistAlbumsPromises);

            //combine initial query with additional queries
            let allAlbums = initialAlbums.items
            for(var x = 0; x < finishedArtistAlbumsPromises.length; x++){
                //finishedArtistAlbumsPromises is a list of objects where each object contains a list of albums, so we need to extract and concat them into one list 
                allAlbums = allAlbums.concat(finishedArtistAlbumsPromises[x])
            }
    
            returnObj={
                initialAlbums:initialAlbums.items,
                finishedArtistAlbumsPromises:finishedArtistAlbumsPromises,
                allAlbums:allAlbums
            }
            console.log(`getAllArtistAlbums() found ${allAlbums.length} albums in total`)
            //fetch tracklist for every single album (20 album ids at a time)
    
            //make sure we have complete tracklist for any large albums
    
            //fetch additional info on each track (50 track ids at a time)
    
    
            resolve(returnObj)
        }catch(err){
            console.log('generatePopularifyData() err=', err)
        }
    })
}

//
// Spotify API Functions
//

//use api to search for an artist
async function searchArtists(searchStr) {
    return new Promise(async function (resolve, reject) {
        //get session
        let useThisSession = await getSession()
        //run query
        useThisSession.searchArtists(searchStr)
            .then(function (data) {
                console.log(`searchArtists() found ${data.body.artists.items.length} results`);
                resolve(data.body.artists.items)
            }, async function (err) {
                reject(err)
                console.error('searchArtists() err: ', err);
                if (err.statusCode == 401) {
                    console.log('demoQuery err')
                }
            });
    });
}

// Get albums by a certain artist
async function getArtistAlbums(artistURI, offset=0, returnTracks=false) {
    console.log(`   getArtistAlbums() offset=${offset}`)
    return new Promise(async function (resolve, reject) {
        //get session
        let useThisSession = await getSession()
        //run query
        useThisSession.getArtistAlbums(artistURI, { offset: offset }).then(function (data) {
            returnTracks ? resolve(data.body.items) : resolve(data.body)
        }, function (err) {
            console.error(" getArtistAlbums() err=", err, ", offset=", offset );
            reject(err)
        });
    })
}


module.exports = {
    getSession: getSession,
    searchArtists: searchArtists,
    generatePopularifyData: generatePopularifyData
};