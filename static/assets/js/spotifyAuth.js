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

//
// Utility Functions
//
async function generatePopularifyData(id) {
    return new Promise(async function (resolve, reject) {
        //get id of every album in artist's discography
        
        //fetch tracklist for every single album (20 album ids at a time)

        //make sure we have complete tracklist for any large albums

        //fetch additional info on each track (50 track ids at a time)


        resolve('ababa')
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







module.exports = {
    getSession: getSession,
    searchArtists: searchArtists,
    generatePopularifyData: generatePopularifyData
};