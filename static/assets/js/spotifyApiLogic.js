//console.log('spotifyApiLogic.js')

var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
    clientId: 'f98aecb59dfa4336921925b2ea14857c',
    clientSecret: '--',
    redirectUri: 'http://localhost:8080/callback'
  });

//keep refreshing martinbarker credentials
//keepRefreshingMyCredentials()
async function keepRefreshingMyCredentials(){
  let martin_access_token = 'BQDyJ5limQu_Vzie6FvGyaHrlHjlBEeZDwSgvInXNMhwKcx4cNS4JmaxMRN7iX2nyTSmRuofIBYU2MpVu51hUOZrkcgbIxHdNlkUucLb1szwTda9uUk1DrF0oW2VNGQOr-QQXY34CkCvN7MYwgr-BoLAQ01WRFcaq1jW3qrB5vPX2MnPaEUtS23zi43TvFiGoUUMD6xJAoJqHXxPTHr002JlUU4XF1wBe4L87bvrlHKBv2eN0KB1zpLc5OQHz51eAaRneRtfUr2LE4WQnaaojV-yTR3lZ90Fgg'
  let martin_refresh_token = 'AQDorlz41LATgAuGj81nuYw3Z7EnPFzuxsCfMU2PjbJlTMHmfChEJZUbQUv5FEljFiftuCZxGnto8RAtnVJt__UL4nGVQ1lc-xnYZoYvfxilz1ubeUPDvu9wh0HVbx2GINo'
  setInterval(async () => {
    const data = await spotifyApi.refreshAccessToken();
    const access_token = data.body['access_token'];

    console.log('The access token has been refreshed!');
    console.log('access_token:', access_token);
    spotifyApi.setAccessToken(access_token);
  }, expires_in / 2 * 1000);

}

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

module.exports = {
    authenticate: authenticate,
    createRedirectURL: createRedirectURL,
    getAllArtistAlbums: getAllArtistAlbums,
};