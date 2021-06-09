var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
//const { Console } = require('console');
//spotifyAuth api file
var spotifyAuth = require('./spotifyAuth');
const { Console } = require('console');

var userIsAuthenticated = false;

//api client for user
var spotifyApi = new SpotifyWebApi({
  clientId: 'f98aecb59dfa4336921925b2ea14857c',
  clientSecret: process.env.clientSecret,
  redirectUri: 'http://localhost:8080/callback'
});

//api client for me (martin) that always works and is always refreshed
var spotifyApiMartin = new SpotifyWebApi({
  clientId: 'f98aecb59dfa4336921925b2ea14857c',
  clientSecret: process.env.clientSecret,
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
    var expires_in = 3600
    setInterval(async () => {
      console.log('keepRefreshingMyCredentials()')
      try{
      const data = await spotifyApiMartin.refreshAccessToken();
      expires_in = data.body['expires_in'];
      const access_token = data.body['access_token'];

      //console.log('spotifyApiMartin() The access token has been refreshed!');
      //console.log('spotifyApiMartin() access_token:', access_token);
      //console.log('spotifyApiMartin() expires_in:', expires_in);
      
      spotifyApiMartinCreds.access_token = access_token;
      spotifyApiMartin.setAccessToken(access_token);
      }catch(err){
        console.log('eeeer=',err)
      }
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

    //
    //  Make initial request to get artist albums (does not include tracklists so parse album_type)
    //  Setup artistAlbumsObj{}
    //
    //retrieve spotifyApiObj 
    let getSpotifyApiObj = await spotifyAuth.getSession()
    console.log('getSpotifyApiObj=',getSpotifyApiObj)

    let artistAlbums;
    try{
      //make query to get albums by artist
      artistAlbums = await getArtistAlbums(artistURI, 0)

    }catch(err){
      //if query failed because of 401(?) too many requests rate limit 
        //fetch new spotifyApiObj and retry
      //else real error
      console.log('errrrrrxzy=',err)
    }

  

    // If there are more albums, get the rest 

    /*
    ////////////////////////////////////
    // Create 'albumIds' list[] object which contains albumId strings of entire discography
    // Store this in file for faster searching?
    // Get all artist album ids
    ////////////////////////////////////
    let total, itemsCount, count, totalCount = 0;
    let body = await getArtistAlbums(artistURI, 0)
    let albumIds = body.items
    itemsCount = body.items.length;
    count = itemsCount + totalCount;
    total = body.total;
    //make additional queries if needed
    console.log(`getAllArtistAlbums() Artist has ${total} albums. We got ${itemsCount} and need to get the rest`);
    while(albumIds.length < total){
      body = await getArtistAlbums(artistURI, albumIds.length)
      albumIds = albumIds.concat(body.items)
    }
    console.log(`getAllArtistAlbums() found ids for ${albumIds.length} albums`)

    ////////////////////////////////////
    // Create query promise for each albumId 20 IDs at a time
    ////////////////////////////////////
    const promises=[];
    let multipleAlbumsQueryLimit = 20;
    for(var x = 0; x < albumIds.length; x+=multipleAlbumsQueryLimit){
      let start=x;
      let end=x+multipleAlbumsQueryLimit;
      if(end>albumIds.length){
        end=albumIds.length;
      }
      //slice list of albums we want to get info about
      var albumsSliced = albumIds.slice(start, end).map(i => {
        return i.id;
      });
      
      //console.log(` getAllArtistAlbums() get data for ${albumsSliced.length} albums: ${start} to ${end}`)
      promises.push(await getMultipleAlbums(albumsSliced));
    }
    //run promises to get album info
    var promisesFinished = await Promise.all(promises);

    ////////////////////////////////////
    // Create 'albums' object{} which contains an artist's entire discography 
    // getMultipleAlbums() returns a list of 20 albums so we need to organize the data
    // Organize by album_type (album , single , compilation, appears_on, ..., n-string)
    ////////////////////////////////////
    var albumsObj = {};
    for(var i = 0; i < promisesFinished.length; i++){
      for(var z = 0; z < promisesFinished[i].length; z++){
        var album_type=promisesFinished[i][z].album_type;
        if( `${album_type}` in albumsObj ) {
        }else{
          albumsObj[`${album_type}`]=[]
        }
        albumsObj[`${album_type}`].push(promisesFinished[i][z])

      }
    }

    ////////////////////////////////////
    // use albumsObj to 
    ////////////////////////////////////
    // get ids in order of single, album, compilation, other
    let rankingList=['single', 'album', 'compilation']
    for(var i = 0; i < rankingList.length; i++){
      //get index values closer starting at 0 
      if(albumsObj[`${rankingList[i]}`]){
        //remove categoryObj from albumsObj{}
        let tempCategoryObj=albumsObj[`${rankingList[i]}`]
        albumsObj[`${rankingList[i]}`]=null;
        //let newPromiseTempName=await parseCategoryForData(tempCategoryObj)
      }
    }


    //old:
    let albumsObjCopy=albumsObj;
    
    //create list of promises
    let albumQueryPromises = [];
    //for each key value pair rankingList in albumsObj (i)
    for (const [key, value] of Object.entries(albumsObj)) {
      console.log(`key=${key}`);
      //for each string in rankingList (q)
      for(var i = 0; i < rankingList.length; i++){
        //if key value pair string == rankingList[q]
        if(rankingList[i][`${key}`]){
          //add promise to on first priority
          console.log(`adding ${key} to list of promises`)
          //albumQueryPromises.push()
        }
      }
    }
    //run promises to get album info
    var albumQueryPromisesFinished = []
    albumQueryPromisesFinished = await Promise.all(albumQueryPromises);
    */
    //run list of promises
    

    /*
    for(var i = 0; i < promisesFinished.length; i++){
      albums = albums.concat(promisesFinished[i])
    }

    ////////////////////////////////////
    // Get trackID of every track on album
    // Make sure we have full complete tracklist for every album since spotify api will only return 50 tracks at a time
    ////////////////////////////////////
    let trackIDs = [];
    let albumInfoPromises = [];
    for(var x = 0; x < albums.length; x++){
      var currentTracks = albums[x].tracks.items.length;
      var totalTracks = albums[x].tracks.total;
      if(totalTracks > currentTracks){
        //console.log(`tracks: current=${currentTracks}, total=${totalTracks}, need to get rest of tracks`)
        //let allAlbumTracks = await getAllAlbumTracks(albums[x].id)
        //albumInfoPromises.push(await getAllAlbumTracks(albums[x].id));

        //albums[x].tracks.items = allAlbumTracks;
      }
      
      //get track ids
      //var tempTrackIDs = albums[x].tracks.items.map(function(item) {
      //  return item.id;
      //});
      //trackIDs=trackIDs.concat(tempTrackIDs)
     

    }
    //var albumInfoPromisesFinished = await Promise.all(albumInfoPromises);

    ////////////////////////////////////
    // Get popularity for each track (50 at a time)
    ////////////////////////////////////
    const trackInfoPromises=[];
    let multipleTracksQueryLimit = 50;
    for(var x = 0; x < trackIDs.length; x+=multipleTracksQueryLimit){
      let start=x;
      let end=x+multipleTracksQueryLimit;
      if(end>trackIDs.length){
        end=trackIDs.length;
      }
      //slice list of albums we want to get info about
      var tracksSliced = trackIDs.slice(0, 50).map(i => {
        return i;
      });
      trackInfoPromises.push(await getTracks(tracksSliced));
    }
    //run promises to get album info
    var trackInfoPromisesFinished = await Promise.all(trackInfoPromises);
    //concatenate results into single list since getTracks() returns 50 at a time
    var tracks = [];
    for(var i = 0; i < trackInfoPromisesFinished.length; i++){
      tracks = tracks.concat(trackInfoPromisesFinished[i])
    }
    
    */

    resolve({
      artistAlbums:artistAlbums,
            //artistAlbumsBody:body,
 //     albumIds:albumIds, 
 //     albums:albums,
 //     trackIDs:trackIDs,
      //trackInfoPromisesFinished:trackInfoPromisesFinished,
  //    tracks: tracks,
      //albumInfoPromisesFinished:albumInfoPromisesFinished,
            //albumsObj:albumsObj,
            //albumQueryPromisesFinished:albumQueryPromisesFinished

    })
  })
}
async function getTracks(tracks){
  return new Promise(async function (resolve, reject) {
  /* Get Audio Features for a Track */
  spotifyApiMartin.getTracks(tracks)
    .then(function(data) {
      //console.log(data.body);
      resolve(data.body)
    }, function(err) {
      console.log(err)
      reject(err);
    });
  })
}

async function getTrackInfo(trackId){
  return new Promise(async function (resolve, reject) {
  /* Get Audio Features for a Track */
  spotifyApiMartin.getTrack(trackId)
    .then(function(data) {
      //console.log(data.body);
      resolve(data.body)
    }, function(err) {
      reject(err);
    });
  })
}

async function getAllAlbumTracks(albumURI, offset=0){
  return new Promise(async function (resolve, reject) {
    //make initial query to get tracks in an album
    let body = await getAlbumTracks(albumURI, offset)
    //get tracks
    let tracks = body.items
    //get total number of tracks in this album
    let total = body.total;
    //while there are more tracks to get from an album
    while(tracks.length < total){
      let moreTracks = await getAlbumTracks(albumURI, tracks.length)
      tracks = tracks.concat(moreTracks.items)
    }
    resolve(tracks)
  })
}

async function getAlbumTracks(albumURI, offset=0){
  return new Promise(async function (resolve, reject) {
    spotifyApiMartin.getAlbumTracks(albumURI, { offset: offset })
    .then(function(data) {
      //console.log('album tracks:', data.body);
      resolve(data.body)
    }, function(err) {
      console.log('Something went wrong!', err);
    });
  })
}

async function getMultipleAlbums(albums){
  return new Promise(async function (resolve, reject){
    // Get multiple albums
    spotifyApiMartin.getAlbums(albums)
    .then(function(data) {
      resolve(data.body.albums)
    }, function(err) {
      console.error(err);
      reject(err)
    });
  })
}

async function getArtistAlbums(artistURI, offset=0){
  return new Promise(async function (resolve, reject) {
    // Get albums by a certain artist
    var useThisSpotifyApi;
    if(userIsAuthenticated){
      useThisSpotifyApi = spotifyApi;
    }else{
      useThisSpotifyApi = spotifyApiMartin
    }
    //spotifyApi or spotifyApiMartin ?
    useThisSpotifyApi.getArtistAlbums(artistURI, { offset : offset }).then(function(data) {
      resolve(data.body)
    }, function(err) {
      console.error(err);
      reject(err)
    });

  })
}

async function searchForArtists(input, useThisApiObj){
  console.log('searchForArtists() ', input)
  return new Promise(async function (resolve, reject) {
    //let getSpotifyApiObj = await spotifyAuth.getSession()

    useThisApiObj.searchArtists(input)
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

//generate popularify data (sort all tracks from artist by popularity)
async function generatePopularifyData(id){
  return new Promise(async function (resolve, reject) {
    let popularifyData = []
    try{
      popularifyData=['temp']
      //get every album / release / single  / appearance from artist 
      let artistAlbums = await getAllArtistAlbums(id, 0) //spotify:artist:42tN6kVgx34E0Oqk2nef4g
      
      //get all tracks sorted by popularity

      //return formatted data
      popularifyData=artistAlbums;

    }catch(err){
      popularifyData=['err']
    }

    resolve(popularifyData)
  })
}

module.exports = {
    authenticate: authenticate,
    createRedirectURL: createRedirectURL,
    getAllArtistAlbums: getAllArtistAlbums,
    searchForArtists: searchForArtists,
    generatePopularifyData: generatePopularifyData
};