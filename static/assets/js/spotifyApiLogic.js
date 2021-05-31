var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');

//api client for user
var spotifyApi = new SpotifyWebApi({
  clientId: 'f98aecb59dfa4336921925b2ea14857c',
  clientSecret: '--',
  redirectUri: 'http://localhost:8080/callback'
});

//api client for me (martin) that always works and is always refreshed
var spotifyApiMartin = new SpotifyWebApi({
  clientId: 'f98aecb59dfa4336921925b2ea14857c',
  clientSecret: '--',
  redirectUri: 'http://localhost:8080/callback'
});
//store access_token and refresh_token for martin spotify auth in json file
let spotifyApiMartinCredsRaw = fs.readFileSync('static/assets/json/spotifyApiMartinCreds.json');
let spotifyApiMartinCreds = JSON.parse(spotifyApiMartinCredsRaw);

var spotifyApiMartinCreds_old = {
  access_token: 'BQAme9I2Hwwgdf2NUXmGxx7YqdzkeutU0BUJfUPe0V4fpCR__Ap82xaaWKhdnbEeJ2HccQVewcb2plqGsh75LwjFlXg_Qvmk9a_4GQl4sFikOfnV_AtnOssbG4zR2hwrBNmy3XaijabWJV-xmwmq1D0OR9LoMk5jeBICyLzQdl01CLLa1ZTbMyLHAlxMxzIDt5_4CCzUUcIlHlQ6MCWstXUbb6Ekw0Wj62E6_sl9sgB12rCxnECQULH86eggeEePA0beH7MRU0tCAEpV-XT9qWcyF50z5tXSzA',
  refresh_token: 'AQCTq48SwYmrtgeqZ6YgP4Gcusa6czcS7D-VugMKMHFxxdxvGfgIDiG-TVjg2jRDm5zLx_qIHYCLNHRQzIeK7SHAtizhHwXimW6_kFILPh8WO1jqDV4UZderNj740a-v0kE',
}

//keep refreshing spotifyApiMartin credentials
keepRefreshingMyCredentials()
async function keepRefreshingMyCredentials(){
  try{
    spotifyApiMartin.setAccessToken(spotifyApiMartinCreds.access_token);
    spotifyApiMartin.setRefreshToken(spotifyApiMartinCreds.refresh_token);
    var expires_in = 60
    setInterval(async () => {
      const data = await spotifyApiMartin.refreshAccessToken();
      expires_in = data.body['expires_in'];
      const access_token = data.body['access_token'];

      //console.log('spotifyApiMartin() The access token has been refreshed!');
      //console.log('spotifyApiMartin() access_token:', access_token);
      //console.log('spotifyApiMartin() expires_in:', expires_in);
      spotifyApiMartinCreds.access_token = access_token;
      spotifyApiMartin.setAccessToken(access_token);

    }, expires_in / 2 * 1000);
  }catch(err){
    console.log(`There was an error authenticating spotifyApiMartin, maybe update spotifyApiMartinCreds. err=`, err)
    reAuthenticateMartin()
  }
}

async function reAuthenticateMartin(){
  const data = await spotifyApiMartin.refreshAccessToken();
  console.log('reAuthenticateMartin()')
  expires_in = data.body['expires_in'];
  const access_token = data.body['access_token'];
  //const refresh_token = data.body['refresh_token'];

  console.log('reAuthenticateMartin() expires_in:', expires_in);
  console.log('reAuthenticateMartin() access_token:', access_token);
  //console.log('reAuthenticateMartin() refresh_token:', refresh_token);

  //write new access_token in json file
  //spotifyApiMartinCreds.access_token = access_token;

  let spotifyApiMartinCredsNew = {
    "access_token": access_token,
    "refresh_token": spotifyApiMartinCreds.refresh_token
  }
  let spotifyApiMartinCredsNewJson = JSON.stringify(spotifyApiMartinCredsNew);
  fs.writeFileSync('static/assets/json/spotifyApiMartinCreds.json', spotifyApiMartinCredsNewJson);
  
  spotifyApiMartin.setAccessToken(access_token);
}

//authenticate user who wants to sign in 
async function authenticate(error, code, state){
  return new Promise(async function (resolve, reject) {
    if (error) {
        console.error('Callback Error:', error);
        reject(`Callback Error: ${error}`);
      }

    spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];
  
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);
  
      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);
  
      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
  
      //const result = getMe.setupApi(access_token);
      //console.log('result = ',result)
      //getMe.getMyData();
  
      resolve({
        access_token: access_token
      });
  
      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];
  
        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
      }, expires_in / 2 * 1000);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      reject(`Error getting Tokens: ${error}`);
    });

  })
}

async function createRedirectURL(){
  return new Promise(async function (resolve, reject) {
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
      resolve(spotifyApi.createAuthorizeURL(scopes));
  })
}

async function getAllArtistAlbums(artistURI){
  return new Promise(async function (resolve, reject) {
    // make initial request to Get albums by a certain artist
    let total, itemsCount, count, totalCount = 0;
    let albums = []

    let body = await getArtistAlbums(artistURI, 0)
    albums = body.items
    itemsCount = body.items.length;
    count = itemsCount + totalCount;
    total = body.total;

    console.log(`getAllArtistAlbums() total=${total}`);
    while(albums.length < total){
      //console.log(`getAllArtistAlbums() need to get more. albums.length=${albums.length}, total=${total}`)
      body = await getArtistAlbums(artistURI, albums.length)
      albums = albums.concat(body.items)
    }
    console.log('getAllArtistAlbums() finished, found all albums:', albums.length)

    let albumTracks = await getAlbumTracks(albums[0].id, 0)

    let trackInfo = await getTrackInfo(albumTracks.items[0].id)

    resolve(trackInfo)
  })
}

async function getTrackInfo(trackId){
  return new Promise(async function (resolve, reject) {
  /* Get Audio Features for a Track */
  spotifyApi.getTrack(trackId)
    .then(function(data) {
      console.log(data.body);
      resolve(data.body)
    }, function(err) {
      done(err);
    });
  })
}

async function getAlbumTracks(albumURI, offset=0){
  return new Promise(async function (resolve, reject) {
    spotifyApi.getAlbumTracks(albumURI, { offset: offset })
    .then(function(data) {
      console.log('album tracks:', data.body);
      resolve(data.body)
    }, function(err) {
      console.log('Something went wrong!', err);
    });
  })
}

async function getArtistAlbums(artistURI, offset=0){
  return new Promise(async function (resolve, reject) {
    // Get albums by a certain artist
    spotifyApi.getArtistAlbums(artistURI, { offset : offset }).then(function(data) {
      resolve(data.body)
    }, function(err) {
      console.error(err);
      reject(err)
    });

  })
}

async function searchForArtists(input){
  console.log('searchForArtists() ', input)
  return new Promise(async function (resolve, reject) {

    spotifyApiMartin.searchArtists(input)
    .then(function(data) {
      //console.log('Search artists:', data.body);
      resolve(data.body.artists.items)
    }, async function(err) {
      console.error('searchForArtists(): ', err);
      if(err.statusCode==401){
        console.log('reauthenticate needed')
        reAuthenticateMartin()
        resolve(await searchForArtists(input))
        //let queryAgain = await searchForArtists(input)
        //resolve(queryAgain)
      }
      reject(err)
    });

  })
}

module.exports = {
    authenticate: authenticate,
    createRedirectURL: createRedirectURL,
    getAllArtistAlbums: getAllArtistAlbums,
    searchForArtists: searchForArtists
};