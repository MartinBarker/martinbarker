////////////////////////////////////////
//init setup vars
////////////////////////////////////////
var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
var spotifyTokens = require('../js/spotifyTokens');
let sessions = {}
let sessionsStatus = {}
let spotifyApps = {}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))




////////////////////////////////////////
//init authentication setup functions
////////////////////////////////////////

//create spotify applications
createSpotifyApplications()
async function createSpotifyApplications() {
    for (const [key, value] of Object.entries(spotifyTokens)) {
        let clientId = value.clientId
        let clientSecret = value.clientSecret
        var spotifyApp = await new SpotifyWebApi({
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: 'http://localhost:8080/callback'
        });
        spotifyApps[`${key}`] = spotifyApp
    }
    await authenticateAllSessions2()
}

//authenticate session for each app
async function authenticateAllSessions2() {
    return new Promise(async function (resolve, reject) {
        for (const [key, value] of Object.entries(spotifyTokens)) {
            console.log('authenticateAllSessions2() authenticate: ', key)
            await authSession(key, value['sessions']['martinbarker99']['refresh_token'], key)
        }
        console.log('authenticateAllSessions2() finished, sessionsStatus=',sessionsStatus)
        resolve()
    })
}

////////////////////////////////////////
///utility functions
////////////////////////////////////////

//authenticate a session and add it to sessions{} object as 'active'
async function authSession(spotifyAppName, refreshToken, sessionCredsName) {
    return new Promise(async function (resolve, reject) {
        try {
            //get spotifyApp
            let spotifyApp=spotifyApps[`${spotifyAppName}`]
            spotifyApp.setRefreshToken(refreshToken);
            const data = await spotifyApp.refreshAccessToken();
            var accessToken = data.body['access_token'];
            var expiresIn = data.body['expires_in'];
            spotifyApp.setAccessToken(accessToken);

            sessions[`${sessionCredsName}`] = spotifyApp;
            sessionsStatus[`${sessionCredsName}`] = 'active';

            setInterval(async () => {
                try {
                    const data = await spotifyApp.refreshAccessToken();
                    expiresIn = data.body['expires_in'];
                    accessToken = data.body['access_token'];
                    console.log('authSession() The access token has been refreshed!');

                } catch (err) {
                    console.log('authSession() interval auth err=', err)
                }
            }, expiresIn / 2 * 1000);
            resolve()
        } catch (err) {
            console.log('authSession() initial auth err=', err)
        }
    })
}

async function getAccessToken(){
    return new Promise(async function (resolve, reject) {
        let accessToken = sessions['Popularify-app1']['_credentials']['accessToken']
        console.log('getAccessToken() accessToken=',accessToken)
        
        resolve(accessToken)
    })
}

//retrieve a session for making queries with 
async function getSession(dontUseTheseCreds = []) {
    return new Promise(async function (resolve, reject) {
        console.log('getSession() sessionsStatus = \n', sessionsStatus)
        //find a session to use
        let activeSessionFound = false;
        for (const [key, value] of Object.entries(sessionsStatus)) {
            if (value == 'active') {
                //console.log(`       getSession() ${key} session is active, so return it`)
                activeSessionFound = true;
                resolve({
                    session: sessions[`${key}`],
                    name: `${key}`
                })
            } else if (value == 'cooldown') {
                //console.log(`       getSession() ${key} session is cooldown, so DONT return it`)
            }
        }
        if (!activeSessionFound) {
            //console.log(`getSession() no active session found`)
        }
    })

}

//handle 429 error for when a spotify app session has had too many requests and needs to go into cooldown
async function handle429Err(sessionName, debugFunctionName) {
    return new Promise(async function (resolve, reject) {
        try{
            console.log(`handle429Err() ${debugFunctionName} too many requests, need to set this session as "cooldown" for 30 seconds`)
            //mark this session as in cooldown mode
            //console.log(`handle429Err() ${debugFunctionName} setting ${sessionName} session to cooldown`)
            sessionsStatus[`${sessionName}`] = 'cooldown';
            //after 30 seconds, mark session as 'active'
            await delay(7000)
            //changeSessionStatus(sessionName, 'active', 1500)
            //setTimeout(function () {
            //    console.log(`handle429Err() ${debugFunctionName} setting ${sessionName} session to active`)
            sessionsStatus[`${sessionName}`] = 'active'
            //}, 3000);
            //console.log(`handle429Err() done`)
            resolve()
        }catch(err){
            //console.log('handle429Err() err=',err)
            reject()
        }

    })
}

//change sesion status after waiting
async function changeSessionStatus(sessionName, status, delayTime){
    //wait
    await delay(delayTime) 
    //change
    sessionsStatus[`${sessionName}`] = status
    console.log(`changeSessionStatus() ${sessionName} set to ${status} `)
}

//generate popularify data
async function generatePopularifyData(artistURI) {
    return new Promise(async function (resolve, reject) {
        try {
            let returnObj = {};
            let albumIds = [];
            ////////////////////////////////////////////////////
            // Get albums 20 ids at a time
            ////////////////////////////////////////////////////

            //make initial request for albums
            let initialAlbums = await getArtistAlbums(artistURI, 0, false)
            total = initialAlbums.total;
            albumIds.push(initialAlbums.items)

            //make additional queries if needed
            console.log(`generatePopularifyData() Artist has ${total} albums. We have ${initialAlbums.items.length} so far and need to get ${total - (initialAlbums.items.length)} more`);
            let artistAlbumsPromises = [];
            for (var x = 20; x < total; x += 20) {
                artistAlbumsPromises.push(getArtistAlbums(artistURI, x, true))
            }

            //complete promises
            let finishedArtistAlbumsPromises = await Promise.all(artistAlbumsPromises);

            //combine initial query with additional queries
            let allAlbums = initialAlbums.items
            for (var x = 0; x < finishedArtistAlbumsPromises.length; x++) {
                //finishedArtistAlbumsPromises is a list of objects where each object contains a list of albums, so we need to extract and concat them into one list 
                allAlbums = allAlbums.concat(finishedArtistAlbumsPromises[x])
            }

            returnObj = {
                initialAlbums: initialAlbums.items,
                //finishedArtistAlbumsPromises:finishedArtistAlbumsPromises,
                allAlbums: allAlbums
            }
            console.log(`generatePopularifyData() found ${allAlbums.length} albums in total`)

            ////////////////////////////////////
            // Get tracklist data for each albumId 20 albumIds at a time
            ////////////////////////////////////
            const albumTracklistPromises = [];
            let multipleAlbumsQueryLimit = 20;
            for (var x = 0; x < allAlbums.length; x += multipleAlbumsQueryLimit) {
                let start = x;
                let end = x + multipleAlbumsQueryLimit;
                if (end > allAlbums.length) {
                    end = allAlbums.length;
                }
                //slice list of albums we want to get info about
                var albumsSliced = allAlbums.slice(start, end).map(i => {
                    return i.id;
                });

                //console.log(` getAllArtistAlbums() get data for ${albumsSliced.length} albums: ${start} to ${end}`)
                albumTracklistPromises.push(getAlbums(albumsSliced));
            }
            //run promises to get album info
            var albumTracklistPromisesFinished = await Promise.all(albumTracklistPromises);
            returnObj.albumTracklistPromisesFinished = albumTracklistPromisesFinished

            ////////////////////////////////////
            // make sure we have complete tracklist for every album
            ////////////////////////////////////
            let allAlbumTracks = []
            for (var x = 0; x < albumTracklistPromisesFinished.length; x++) {
                for (var y = 0; y < albumTracklistPromisesFinished[x].length; y++) {
                    let currentAlbumId = albumTracklistPromisesFinished[x][y].id;
                    let currentAlbumTracks = albumTracklistPromisesFinished[x][y].tracks.items;
                    let tracksTotal = albumTracklistPromisesFinished[x][y].tracks.total;
                    while (currentAlbumTracks.length < tracksTotal) {
                        //console.log(`currentAlbumId=${currentAlbumId}, tracksTotal=${tracksTotal}, currentAlbumTracks.length=${currentAlbumTracks.length} so get more tracks`)
                        let additionalAlbumInfo = await getAlbumTracks(currentAlbumId, currentAlbumTracks.length)
                        currentAlbumTracks = currentAlbumTracks.concat(additionalAlbumInfo.items)
                    }
                    //console.log(`album needs ${tracksTotal} tracks in total, we have ${currentAlbumTracks.length}`)
                    allAlbumTracks = allAlbumTracks.concat(currentAlbumTracks)
                }
            }
            returnObj.allAlbumTracks = allAlbumTracks;
            console.log('generatePopularifyData() allAlbumTracks.length=',allAlbumTracks.length)


            ////////////////////////////////////
            // Fetch additional data (popularity) for each track (50 at a time)
            ////////////////////////////////////
            let tempSlices = []

            const trackInfoPromises = [];
            let multipleTracksQueryLimit = 50;
            for (var x = 0; x < allAlbumTracks.length; x += multipleTracksQueryLimit) {
                let start = x;
                let end = x + multipleTracksQueryLimit;
                if (end > allAlbumTracks.length) {
                    end = allAlbumTracks.length;
                }
                //slice list of albums we want to get info about
                //console.log(`slice tracks from ${start} to ${end}`)
                var tracksSliced = allAlbumTracks.slice(start, end).map(i => {
                    return i.id;
                });
                tempSlices.push(tracksSliced)

                //returnObj.tracksSliced = returnObj.tracksSliced.push(tracksSliced)
                trackInfoPromises.push(getTracks(tracksSliced));
            }
            //run promises to get album info
            var trackInfoPromisesFinished = await Promise.all(trackInfoPromises);
            //concatenate results into single list since getTracks() returns 50 at a time
            var tracks = [];
            for (var i = 0; i < trackInfoPromisesFinished.length; i++) {
                tracks = tracks.concat(trackInfoPromisesFinished[i].tracks)
            }
            console.log('generatePopularifyData() tracks.length=',tracks.length)

            returnObj.tempSlices = tempSlices
            returnObj.tracks = tracks

            resolve(returnObj)
        } catch (err) {
            console.log('generatePopularifyData() err=', err)
        }
    })
}

////////////////////////////////////////
//Spotify API functions
////////////////////////////////////////

//search for artist, return first 20 results
async function searchArtists(searchStr) {
    return new Promise(async function (resolve, reject) {
        console.log('searchStr() ', searchStr)
        //get session
        let useThisSessionRsp = await getSession()
        let useThisSession = useThisSessionRsp.session
        let useThisSessionName = useThisSessionRsp.name
        //run query
        useThisSession.searchArtists(searchStr)
            .then(function (data) {
                //console.log(`searchArtists() found ${data.body.artists.items.length} results using session:${useThisSessionName}`);
                resolve(data.body.artists.items)
            }, async function (err) {
                console.error('searchArtists() err: ', err);
                if (err.statusCode == 429) {
                    await handle429Err(useThisSessionName, 'searchArtists()')
                    //rerun function
                    return await searchArtists(searchStr);
                }
                //reject(err)
            });
    });
}




/////////~~~~~~~~~~~~~~~~~~~~~~~~~ old ~~~~~~~~~~~~~~~~~~~

//create redirect url
async function createRedirectURL() {
    return new Promise(async function (resolve, reject) {
        //create scopes
        const scopes = [
            'ugc-image-upload',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'streaming',
            'app-remote-control',
            'user-read-email',
            'user-read-private',
            'playlist-read-collaborative',
            'playlist-modify-public',
            'playlist-read-private',
            'playlist-modify-private',
            'user-library-modify',
            'user-library-read',
            'user-top-read',
            'user-read-playback-position',
            'user-read-recently-played',
            'user-follow-read',
            'user-follow-modify'
        ];
        //get spotify app
        let spotifyApp = spotifyApps[`Popularify-app3`]
        resolve(spotifyApp.createAuthorizeURL(scopes));
    })
}

//authenticate callback for user signing in
async function authCallback(error, code, state) {
    return new Promise(async function (resolve, reject) {
        if (error) {
            console.error('Callback Error:', error);
            reject(`Callback Error: ${error}`);
        }

        //get spotify app object
        let spotifyApp = spotifyApps[`Popularify-app3`]

        spotifyApp
            .authorizationCodeGrant(code)
            .then(data => {
                const access_token = data.body['access_token'];
                const refresh_token = data.body['refresh_token'];
                const expires_in = data.body['expires_in'];

                //spotifyApp.setAccessToken(access_token);
                //spotifyApp.setRefreshToken(refresh_token);
                console.log(`user logged in: access_token=${access_token}, refresh_token=${refresh_token}`)
                resolve({
                    access_token: access_token,
                    refresh_token: refresh_token
                });

                /*
                setInterval(async () => {
                    const data = await spotifyApi.refreshAccessToken();
                    const access_token = data.body['access_token'];

                    console.log('The access token has been refreshed!');
                    console.log('access_token:', access_token);
                    spotifyApi.setAccessToken(access_token);
                }, expires_in / 2 * 1000);
                */
            })
            .catch(error => {
                console.error('Error getting Tokens:', error);
                reject(`Error getting Tokens: ${error}`);
            });

    })
}

//authenticate all sessions
//authenticateAllSessions()
async function authenticateAllSessions_old() {
    for (const [key, value] of Object.entries(spotifyTokensJSON)) {
        authenticateSession(key)
    }
}

//authenticate a session
async function authenticateSession_old(sessionCredsName) {
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
    sessionsStatus[`${sessionCredsName}`] = 'active';

    setInterval(async () => {
        console.log('keepRefreshingMyCredentials()')
        try {
            const data = await spotifyApiMartin.refreshAccessToken();
            expires_in = data.body['expires_in'];
            const access_token = data.body['access_token'];

            console.log('authenticateSession1() The access token has been refreshed!');
            console.log('authenticateSession1() access_token:', access_token);
            console.log('authenticateSession1() expires_in:', expires_in);

        } catch (err) {
            console.log('eeeer=', err)
        }
    }, expires_in / 2 * 1000);

}

// Get albums by a certain artist
async function getArtistAlbums(artistURI, offset = 0, returnTracks = false) {
    //console.log(`   getArtistAlbums() offset=${offset}`)
    return new Promise(async function (resolve, reject) {
        //get session
        let useThisSessionRsp = await getSession()
        let useThisSession = useThisSessionRsp.session
        let useThisSessionName = useThisSessionRsp.name
        //run query
        useThisSession.getArtistAlbums(artistURI, { offset: offset }).then(function (data) {
            if (returnTracks) {
                resolve(data.body.items)
            } else {
                resolve(data.body)
            }

        }, async function (err) {
            console.error('getArtistAlbums() err: ', err);
            if (err.statusCode == 429) {
                await handle429Err(useThisSessionName, 'getArtistAlbums()')
                //rerun function
                return await getArtistAlbums(artistURI, offset, returnTracks);
            }
            //reject(err)
        });
    })
}

//get more info for an album or multiple albums at once (20 at a time)
async function getAlbums(albums, retry=0) {
    return new Promise(async function (resolve, reject) {
        //get session
        let useThisSessionRsp = await getSession()
        let useThisSession = useThisSessionRsp.session
        let useThisSessionName = useThisSessionRsp.name
        //run query 
        useThisSession.getAlbums(albums)
            .then(function (data) {
                resolve(data.body.albums)
            }, async function (err) {
                console.log(`getAlbums() retry=${retry}, wait ${3*retry} seconds. err=`,err)
                await delay(3000*retry) 
                if (err.statusCode == 429) {
                    await handle429Err(useThisSessionName, 'getAlbums()')
                    //rerun function
                    return await getAlbums(albums, ++retry);
                }
                //reject(err)
            });
    })
}

async function getAlbum(album, offset = 0) {
    return new Promise(async function (resolve, reject) {
        //get session
        let useThisSessionRsp = await getSession()
        let useThisSession = useThisSessionRsp.session
        let useThisSessionName = useThisSessionRsp.name
        //run query 
        useThisSession.getAlbum(album, { offset: offset })
            .then(function (data) {
                resolve(data.body)
            }, function (err) {
                console.error(err);
                reject(err)
            });
    })
}

async function getAlbumTracks(album, offset = 0, limit = 50) {
    return new Promise(async function (resolve, reject) {
        //get session
        let useThisSessionRsp = await getSession()
        let useThisSession = useThisSessionRsp.session
        let useThisSessionName = useThisSessionRsp.name
        //run query 
        useThisSession.getAlbumTracks(album, { offset: offset, limit: limit })
            .then(function (data) {
                resolve(data.body)
            }, async function (err) {
                console.error('getAlbumTracks() err: ', err);
                if (err.statusCode == 429) {
                    await handle429Err(useThisSessionName, 'getAlbumTracks()')
                    //rerun function
                    return await getAlbumTracks(album, offset, limit);
                }
                //reject(err)
            });
    })
}

async function getTracks(tracks) {
    return new Promise(async function (resolve, reject) {
        //get session
        let useThisSessionRsp = await getSession()
        let useThisSession = useThisSessionRsp.session
        let useThisSessionName = useThisSessionRsp.name
        //run query 
        useThisSession.getTracks(tracks)
            .then(function (data) {
                //console.log(data.body);
                resolve(data.body)
            }, async function (err) {
                console.error('getTracks() err: ', err);
                if (err.statusCode == 429) {
                    await handle429Err(useThisSessionName, 'getTracks()')
                    //rerun function
                    return await getTracks(tracks);
                }
                //reject(err)
            });
    })
}

module.exports = {
    getAccessToken: getAccessToken,
    authCallback: authCallback,
    createRedirectURL: createRedirectURL,
    getSession: getSession,
    searchArtists: searchArtists,
    generatePopularifyData: generatePopularifyData
};