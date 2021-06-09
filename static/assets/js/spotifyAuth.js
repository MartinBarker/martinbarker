var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');

let spotifyTokensObj = fs.readFileSync('static/assets/json/spotifyTokens.json');
let spotifyTokensJSON = JSON.parse(spotifyTokensObj);

let sessions={}

async function getSession(dontUseTheseCreds=[]){
    return new Promise(async function (resolve, reject) {
        console.log('getSession(), sessions=',sessions)
        //if there are no sessions
        if(sessions.length <= 0){
            //init new sessions
        }else{
            resolve(sessions['martinradio2'])
            
        }
    })
}

let newSessions=[]
async function authenticateSession1(sessionCredsName){
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
            
        newSessions.push(spotifyApiMartin)

       newSessions[0].searchArtists('carti')
        .then(function(data) {
            console.log('Search artists:', data.body.artists.items.length);
        }, async function(err) {
            console.error('spotifyApiMartin searchForArtists err: ', err);
            if(err.statusCode==401){
                console.log('reauthenticate needed')
            }
        });
        

       var expires_in = 200
       setInterval(async () => {
         console.log('keepRefreshingMyCredentials()')
         try{
         const data = await spotifyApiMartin.refreshAccessToken();
         expires_in = data.body['expires_in'];
         const access_token = data.body['access_token'];
   
         console.log('authenticateSession1() The access token has been refreshed!');
         console.log('authenticateSession1() access_token:', access_token);
         console.log('authenticateSession1() expires_in:', expires_in);
         
         //spotifyApiMartinCreds.access_token = access_token;
         //spotifyApiMartin.setAccessToken(access_token);
         }catch(err){
           console.log('eeeer=',err)
         }
       }, expires_in / 2 * 1000);
    
}

authenticateSession1('martinbarker99')
authenticateSession1('martinradio2')
authenticateSession1('martinradio303')

//authenticate all creds
//authenticateAll()
async function authenticateAll(){
    for (const [key, value] of Object.entries(spotifyTokensJSON)) {
            let accessToken=value['access_token']
            let refreshToken=value['refresh_token']
            let name=key;
            //create spotify object with these credentials
            try{
                await authenticateCreds(accessToken, refreshToken, name)
                await keepRefreshingCredentials(accessToken, refreshToken, name)
            }catch(err){
                console.log('authAll() err=',err)
            }
    }
}

//reauthenticate
async function reauthenticate(name){
    var value=spotifyTokensJSON[name]
    let accessToken=value['access_token']
    let refreshToken=value['refresh_token']
    //create spotify object with these credentials
    try{
        await authenticateCreds(accessToken, refreshToken, name)
    }catch(err){
        console.log('authAll() err=',err)
    }
}

async function authenticateCreds(accessToken, refreshToken, name){
    console.log('authenticateCreds() name=',name)
    //return new Promise(async function (resolve, reject) {
        var spotifyApiSession = new SpotifyWebApi({
            clientId: 'f98aecb59dfa4336921925b2ea14857c',
            clientSecret: process.env.clientSecret,
            redirectUri: 'http://localhost:8080/callback'
        });

        spotifyApiSession.setAccessToken(accessToken);
        spotifyApiSession.setRefreshToken(refreshToken);

        const data = await spotifyApiSession.refreshAccessToken();
        //console.log('reAuthenticateMartin()')
        expires_in = data.body['expires_in'];
        var newAccessToken = data.body['access_token'];

        //make test query
        let dataResp = await spotifyApiSession.getTrack('2zavoMfVVPJMikH57fd8yK').then(function(data) {
            return(data.body)
        }, function(err) {
            console.error(err);
            return(err)
        });
        console.log('dataResp=',dataResp)

        //write new access_token in json file
        let credsNew = {
          "access_token": newAccessToken,
          "refresh_token": refreshToken
        }
        let credsNewJson = JSON.stringify(credsNew);
        let spotifyTokensObj = fs.readFileSync('static/assets/json/spotifyTokens.json');
        spotifyTokensObj[`${name}`]=credsNewJson;
        fs.writeFileSync('static/assets/json/spotifyTokens.json', spotifyTokensObj);

        console.log(`adding ${name} to sessions`)
        sessions[`${name}`] = spotifyApiSession;

        

        
        return('done')
   // })
}

async function keepRefreshingCredentials(accessToken, refreshToken, name){
    try{
        let spotifyApiSession=sessions[`${name}`];
        spotifyApiSession.setAccessToken(accessToken);
        spotifyApiSession.setRefreshToken(refreshToken);
        var expires_in = 1000;//3600
        setInterval(async () => {
            console.log('Refresh Creds for ', name)
            try{
                //get new access_token
                const data = await spotifyApiSession.refreshAccessToken();
                expires_in = data.body['expires_in'];
                const newAccessToken = data.body['access_token'];
                console.log('newAccessToken for ', name, ' = ', newAccessToken)

                spotifyApiSession.setAccessToken(newAccessToken);
                sessions[`${name}`]=spotifyApiSession

                //write new access_token in json file
                let credsNew = {
                    "access_token": newAccessToken,
                    "refresh_token": refreshToken
                }
                let credsNewJson = JSON.stringify(credsNew);
                let spotifyTokensObj = fs.readFileSync('static/assets/json/spotifyTokens.json');
                spotifyTokensObj[`${name}`]=credsNewJson;
                fs.writeFileSync('static/assets/json/spotifyTokens.json', spotifyTokensObj);
                //save to sessions
                sessions[`${name}`] = spotifyApiSession;
            }catch(err){
                console.log('eeeer=',err)
            }
        }, expires_in / 2 * 1000);
    }catch(err){
        console.log(`There was an error authenticating spotifyApiSession, maybe update spotifyApiSessionCreds. err=`, err)
    }
}


module.exports = {
    getSession: getSession,
    reauthenticate:reauthenticate
};