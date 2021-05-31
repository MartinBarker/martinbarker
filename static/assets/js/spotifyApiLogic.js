//console.log('spotifyApiLogic.js')

var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
    clientId: '88fe1deffecc4b67a01ab6d83837a5a5',
    clientSecret: '----',
    redirectUri: 'http://localhost:8080/callback'
  });

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
  
      resolve('Success! You can now close the window.');
  
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

module.exports = {
    authenticate: authenticate,
    createRedirectURL: createRedirectURL,
};