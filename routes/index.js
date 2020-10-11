const express = require('express');
const app = express();
var router = express.Router();
//nodejs virbant color picker extension
var Vibrant = require('node-vibrant');
const { xyzToCIELab } = require('node-vibrant/lib/util');
const Post = require('../database/models/Post.js');
//connect to mongodb
var mongodbutil = require('../static/assets/js/mongodbutils');
var db = mongodbutil.getDb();

//global vars
allBlogPosts = []

//view single blog post
app.get('/posts/:id', async (req, res) => {
  //get mainTemplate data
  let mainTemplateData = await getMainTemplateData(req.params.id)
  //get post
  let post = null;
  for (var i = 0; i < allBlogPosts.length; i++) {
    if (allBlogPosts[i]['_id'] == req.params.id) {
      post = allBlogPosts[i]
    }
  }
  //get displayposts
  let displayPosts = mainTemplateData.postsDisplay;

  res.render('post', {
    layout: 'mainTemplate',
    post: post,
    pageTitle: post.title,
    blog: 'active',
    icon:'https://cdn0.iconfinder.com/data/icons/picons-social/57/53-medium-512.png',
    pageBodyNavTitle: `${post.title}`,
    pageBodyNaavGithub: 'x',
    postTitle: post.title,
    postDescription: post.description,
    postContent: post.content,
    postDate: post.createdAt,
    //list to display for navbar 'Blog' options
    posts: displayPosts,
    //mainTemplateData
    imgPath: '/' + mainTemplateData.imgPath,
    imgSrcUrl: mainTemplateData.imgSrc,
    imgListen: mainTemplateData.imgListen,
    textColor1: mainTemplateData.colorData.textColor1, //'Martin Barker' Navbar Header text color
    backgroundColor1: mainTemplateData.colorData.backgroundColor1, //'Martin Barker' Navbar Header Background Color
    textColor6: mainTemplateData.colorData.textColor6, //sidebar un-active tab text color
    backgroundColor2: mainTemplateData.colorData.backgroundColor2, //sidebar un-active tab background color
    textColor2: mainTemplateData.colorData.textColor2, //sidebar active tab
    backgroundColor3: mainTemplateData.colorData.backgroundColor3, //sidebar active tab
    textColor7: mainTemplateData.colorData.textColor7, //sidebar lower background
    backgroundColor7: mainTemplateData.colorData.backgroundColor7, //sidebar lower background
    textColor3: mainTemplateData.colorData.textColor3, //sidebar hover tab color
    backgroundColor4: mainTemplateData.colorData.backgroundColor4, //sidebar hover tab color
    textColor4: mainTemplateData.colorData.textColor4, //body header title color
    backgroundColor6: mainTemplateData.colorData.backgroundColor6, //body header title color
    textColor5: mainTemplateData.colorData.textColor5, //body color
    backgroundColor5: mainTemplateData.colorData.backgroundColor5, //body color
    //img color display boxes
    Vibrant: mainTemplateData.colorData.Vibrant,
    LightVibrant: mainTemplateData.colorData.LightVibrant,
    DarkVibrant: mainTemplateData.colorData.DarkVibrant,
    Muted: mainTemplateData.colorData.Muted,
    LightMuted: mainTemplateData.colorData.LightMuted,
    DarkMuted: mainTemplateData.colorData.DarkMuted,

  })

});

//home route
app.get('/', async function (req, res) {
  console.log('route / ')
  //get mainTemplate data
  let mainTemplateData = await getMainTemplateData(req.params.id)
  //const post = await Post.findById(req.params.id)
  let displayPosts = mainTemplateData.postsDisplay;
  
  res.render('about', {
    //template layout to use
    layout: 'mainTemplate',
    //page title of tab
    pageTitle: 'martinbarker.me',
    //page tab icon
    icon: "https://cdn0.iconfinder.com/data/icons/picons-social/57/53-medium-512.png",
    //set active current tab
    about: 'active',
    //body content title 
    pageBodyNavTitle: 'martinbarker.me',
    //body content github link
    pageBodyNavGithub: 'temp',
    //list to display for navbar 'Blog' options
    posts: displayPosts,
    //mainTemplateData
    imgPath: '/' + mainTemplateData.imgPath,
    imgSrcUrl: mainTemplateData.imgSrc,
    imgListen: mainTemplateData.imgListen,
    textColor1: mainTemplateData.colorData.textColor1, //'Martin Barker' Navbar Header text color
    backgroundColor1: mainTemplateData.colorData.backgroundColor1, //'Martin Barker' Navbar Header Background Color
    textColor6: mainTemplateData.colorData.textColor6, //sidebar un-active tab text color
    backgroundColor2: mainTemplateData.colorData.backgroundColor2, //sidebar un-active tab background color
    textColor2: mainTemplateData.colorData.textColor2, //sidebar active tab
    backgroundColor3: mainTemplateData.colorData.backgroundColor3, //sidebar active tab
    textColor7: mainTemplateData.colorData.textColor7, //sidebar lower background
    backgroundColor7: mainTemplateData.colorData.backgroundColor7, //sidebar lower background
    textColor3: mainTemplateData.colorData.textColor3, //sidebar hover tab color
    backgroundColor4: mainTemplateData.colorData.backgroundColor4, //sidebar hover tab color
    textColor4: mainTemplateData.colorData.textColor4, //body header title color
    backgroundColor6: mainTemplateData.colorData.backgroundColor6, //body header title color
    textColor5: mainTemplateData.colorData.textColor5, //body color
    backgroundColor5: mainTemplateData.colorData.backgroundColor5, //body color
    //img color display boxes
    Vibrant: mainTemplateData.colorData.Vibrant,
    LightVibrant: mainTemplateData.colorData.LightVibrant,
    DarkVibrant: mainTemplateData.colorData.DarkVibrant,
    Muted: mainTemplateData.colorData.Muted,
    LightMuted: mainTemplateData.colorData.LightMuted,
    DarkMuted: mainTemplateData.colorData.DarkMuted,
  });
})

//projects route
app.get('/projects', async function (req, res) {
  res.redirect('/');
})

//audio-archiver route
app.get('/audio-archiver', async function (req, res) {
  console.log('route /audio-archiver ')
  //get mainTemplate data
  let mainTemplateData = await getMainTemplateData(req.params.id)

  let displayPosts = mainTemplateData.postsDisplay;

  res.render('audio-archiver', {
    //template layout to use
    layout: 'mainTemplate',
    //page title of tab
    pageTitle: 'audio-archiver',
    //page tab icon
    icon: "../static/assets/img/icon.png",
    //expand projects tab
    projects: 'active',
    //set active current tab
    audioarchiver: 'active',
    //body content title 
    pageBodyNavTitle: 'audio-archiver',
    //body content github link
    pageBodyNavSrc: "https://github.com/MartinBarker/audio-archiver",
    //list to display for navbar 'Blog' options
    posts: displayPosts,
    //mainTemplateData
    imgPath: '/' + mainTemplateData.imgPath,
    imgSrcUrl: mainTemplateData.imgSrc,
    imgListen: mainTemplateData.imgListen,
    textColor1: mainTemplateData.colorData.textColor1, //'Martin Barker' Navbar Header text color
    backgroundColor1: mainTemplateData.colorData.backgroundColor1, //'Martin Barker' Navbar Header Background Color
    textColor6: mainTemplateData.colorData.textColor6, //sidebar un-active tab text color
    backgroundColor2: mainTemplateData.colorData.backgroundColor2, //sidebar un-active tab background color
    textColor2: mainTemplateData.colorData.textColor2, //sidebar active tab
    backgroundColor3: mainTemplateData.colorData.backgroundColor3, //sidebar active tab
    textColor7: mainTemplateData.colorData.textColor7, //sidebar lower background
    backgroundColor7: mainTemplateData.colorData.backgroundColor7, //sidebar lower background
    textColor3: mainTemplateData.colorData.textColor3, //sidebar hover tab color
    backgroundColor4: mainTemplateData.colorData.backgroundColor4, //sidebar hover tab color
    textColor4: mainTemplateData.colorData.textColor4, //body header title color
    backgroundColor6: mainTemplateData.colorData.backgroundColor6, //body header title color
    textColor5: mainTemplateData.colorData.textColor5, //body color
    backgroundColor5: mainTemplateData.colorData.backgroundColor5, //body color
    //img color display boxes
    Vibrant: mainTemplateData.colorData.Vibrant,
    LightVibrant: mainTemplateData.colorData.LightVibrant,
    DarkVibrant: mainTemplateData.colorData.DarkVibrant,
    Muted: mainTemplateData.colorData.Muted,
    LightMuted: mainTemplateData.colorData.LightMuted,
    DarkMuted: mainTemplateData.colorData.DarkMuted,
  });
})

//popularify route
app.get('/popularify', async function (req, res) {
  console.log('route /popularify ')
  //get mainTemplate data
  let mainTemplateData = await getMainTemplateData(req.params.id)
  //const post = await Post.findById(req.params.id)
  let displayPosts = mainTemplateData.postsDisplay;

  res.render('popularify', {
    //template layout to use
    layout: 'mainTemplate',
    //page title of tab
    pageTitle: 'popularify.site',
    //page tab icon
    icon: 'https://cdn4.iconfinder.com/data/icons/48-bubbles/48/06.Tags-512.png',
    //expand projects tab
    projects: 'active',
    //set active current tab
    popularify: 'active',
    //body content title 
    pageBodyNavTitle: 'Popularify',
    //body content github link
    pageBodyNavGithub: 'temp',
    //list to display for navbar 'Blog' options
    posts: displayPosts,
    //mainTemplateData
    imgPath: '/' + mainTemplateData.imgPath,
    imgSrcUrl: mainTemplateData.imgSrc,
    imgListen: mainTemplateData.imgListen,
    textColor1: mainTemplateData.colorData.textColor1, //'Martin Barker' Navbar Header text color
    backgroundColor1: mainTemplateData.colorData.backgroundColor1, //'Martin Barker' Navbar Header Background Color
    textColor6: mainTemplateData.colorData.textColor6, //sidebar un-active tab text color
    backgroundColor2: mainTemplateData.colorData.backgroundColor2, //sidebar un-active tab background color
    textColor2: mainTemplateData.colorData.textColor2, //sidebar active tab
    backgroundColor3: mainTemplateData.colorData.backgroundColor3, //sidebar active tab
    textColor7: mainTemplateData.colorData.textColor7, //sidebar lower background
    backgroundColor7: mainTemplateData.colorData.backgroundColor7, //sidebar lower background
    textColor3: mainTemplateData.colorData.textColor3, //sidebar hover tab color
    backgroundColor4: mainTemplateData.colorData.backgroundColor4, //sidebar hover tab color
    textColor4: mainTemplateData.colorData.textColor4, //body header title color
    backgroundColor6: mainTemplateData.colorData.backgroundColor6, //body header title color
    textColor5: mainTemplateData.colorData.textColor5, //body color
    backgroundColor5: mainTemplateData.colorData.backgroundColor5, //body color
    //img color display boxes
    Vibrant: mainTemplateData.colorData.Vibrant,
    LightVibrant: mainTemplateData.colorData.LightVibrant,
    DarkVibrant: mainTemplateData.colorData.DarkVibrant,
    Muted: mainTemplateData.colorData.Muted,
    LightMuted: mainTemplateData.colorData.LightMuted,
    DarkMuted: mainTemplateData.colorData.DarkMuted,
  });
})

//popularify spotify api route
app.post('/popularifyRequest', async function (req, res) {
  console.log("/popularifyRequest req.body=", req.body)

  var SpotifyWebApi = require('spotify-web-api-node');

  // credentials are optional
  var spotifyApi = new SpotifyWebApi({
    clientId: 'f80489d0401f431b9ce0b7bff0244248',
    clientSecret: 'b7ec06f77e2340ec939882b267a3f178',
    redirectUri: 'https://masterb-j2xzapyrnq-uc.a.run.app/popularify'
  });

  // Get Elvis' albums
  spotifyApi.getArtistAlbums('5fAix5NwfNgHQqYRrHIPxo').then(
    function (data) {
      res.send(data.body);
    },
    function (err) {
      res.send(err);
    }
  );

});


//tagger route
app.get('/tagger', async function (req, res) {
  console.log('route /tagger ')
  //get mainTemplate data
  let mainTemplateData = await getMainTemplateData(req.params.id)

  let displayPosts = mainTemplateData.postsDisplay;

  res.render('tagger', {
    //template layout to use
    layout: 'mainTemplate',
    //page title of tab
    pageTitle: 'tagger.site',
    //page tab icon
    icon: 'https://cdn4.iconfinder.com/data/icons/48-bubbles/48/06.Tags-512.png',
    //expand projects tab
    projects: 'active',
    //set active current tab
    tagger: 'active',
    //body content title 
    pageBodyNavTitle: 'tagger.site',
    //body content github link
    pageBodyNavGithub: 'https://github.com/MartinBarker/martinbarker/blob/master/views/tagger.handlebars',
    //list to display for navbar 'Blog' options
    posts: displayPosts,
    //mainTemplateData
    imgPath: '/' + mainTemplateData.imgPath,
    imgSrcUrl: mainTemplateData.imgSrc,
    imgListen: mainTemplateData.imgListen,
    textColor1: mainTemplateData.colorData.textColor1, //'Martin Barker' Navbar Header text color
    backgroundColor1: mainTemplateData.colorData.backgroundColor1, //'Martin Barker' Navbar Header Background Color
    textColor6: mainTemplateData.colorData.textColor6, //sidebar un-active tab text color
    backgroundColor2: mainTemplateData.colorData.backgroundColor2, //sidebar un-active tab background color
    textColor2: mainTemplateData.colorData.textColor2, //sidebar active tab
    backgroundColor3: mainTemplateData.colorData.backgroundColor3, //sidebar active tab
    textColor7: mainTemplateData.colorData.textColor7, //sidebar lower background
    backgroundColor7: mainTemplateData.colorData.backgroundColor7, //sidebar lower background
    textColor3: mainTemplateData.colorData.textColor3, //sidebar hover tab color
    backgroundColor4: mainTemplateData.colorData.backgroundColor4, //sidebar hover tab color
    textColor4: mainTemplateData.colorData.textColor4, //body header title color
    backgroundColor6: mainTemplateData.colorData.backgroundColor6, //body header title color
    textColor5: mainTemplateData.colorData.textColor5, //body color
    backgroundColor5: mainTemplateData.colorData.backgroundColor5, //body color
    //img color display boxes
    Vibrant: mainTemplateData.colorData.Vibrant,
    LightVibrant: mainTemplateData.colorData.LightVibrant,
    DarkVibrant: mainTemplateData.colorData.DarkVibrant,
    Muted: mainTemplateData.colorData.Muted,
    LightMuted: mainTemplateData.colorData.LightMuted,
    DarkMuted: mainTemplateData.colorData.DarkMuted,
  });
})

//api route to return pageColors
app.post('/getColors', async function (req, res) {
  //let filepath = req.body.filepath
  console.log("/getColors")
  let colorData = await getColorData()
  res.send(colorData)
});

//get discogs api info
app.post('/discogsAPI', async function (req, res) {
  //get vars 
  let code = req.body.code
  let type = req.body.type
    
  //setup using npm package 'disconnect' for getting discogs api data
  var Discogs = require('disconnect').Client;
  var db = new Discogs().database();

  console.log(`/discogsAPI code = ${code}, type = ${type}`)
  if(type=='master'){
    //cant get master data 
    db.getMaster(code, function(err, resp){

      //if err message is present return that, else return full response 
      if(resp.message){
        res.status(400).send(resp.message)
      }else{
        res.status(200).send(resp)
      }
    });

  }else if(type=='release'){

      //get discogs api data
      db.getRelease(code, function(err, resp){
        //console.log('resp = ', resp)

        //if err message is present return that, else return full response 
        if(resp.message){
          res.status(400).send(resp.message)
        }else{
          res.status(200).send(resp)
        }
      });

  }else if(type=='artist'){
    console.log('get artist data')
    //get discogs artist api data
    db.getArtist(code, function(err, resp){
      if(resp.message){
        res.status(400).send(resp.message)
      }else{
        res.status(200).send(resp)
      }
    });
  }
  
});

//api audio file metadata tags
app.post('/getFileMetadataTags', async function (req, res) {
  var jsonResults = {
    'tags': {
      'releaseArtist': [],
      'releaseInfo': [],
      'tracklist': [],
      'combinations': []
    }
  };
  res.send(jsonResults)
});

async function getMainTemplateData(activeTabId) {
  return new Promise(async function (resolve, reject) {
    //get color data based on a random image from /static/assets/aesthetic-images
    let colorData = await getColorData()
    //get display title for each blog post
    let postsDisplay = await getPostsDisplay(colorData.colors['LightMuted'].hex, activeTabId, getReadableTextColor(colorData.colors['LightMuted'].rgb))

    let mainTemplateData = {
      colorDataRaw: colorData,
      colorData: {
        textColor1: getReadableTextColor(colorData.colors['DarkMuted'].rgb),
        backgroundColor1: colorData.colors['DarkMuted'].hex,
        textColor2: getReadableTextColor(colorData.colors['LightMuted'].rgb), //active tab text color
        backgroundColor2: colorData.colors['LightVibrant'].hex,
        textColor6: getReadableTextColor(colorData.colors['LightVibrant'].rgb),
        backgroundColor3: colorData.colors['LightMuted'].hex,
        textColor7: getReadableTextColor(colorData.colors['DarkVibrant'].rgb),
        backgroundColor7: colorData.colors['DarkVibrant'].hex,
        textColor3: getReadableTextColor(colorData.colors['Vibrant'].rgb), //navbar hover tab text color
        backgroundColor4: colorData.colors['Vibrant'].hex,
        textColor4: getReadableTextColor(colorData.colors['Muted'].rgb),
        backgroundColor6: colorData.colors['Muted'].hex,
        textColor5: getReadableTextColor(colorData.colors['LightMuted'].rgb),
        backgroundColor5: colorData.colors['LightMuted'].hex,
        Vibrant: colorData.colors['Vibrant'].hex,
        LightVibrant: colorData.colors['LightVibrant'].hex,
        DarkVibrant: colorData.colors['DarkVibrant'].hex,
        Muted: colorData.colors['Muted'].hex,
        LightMuted: colorData.colors['LightMuted'].hex,
        DarkMuted: colorData.colors['DarkMuted'].hex,
      },
      imgPath: colorData.imgPath,
      imgSrc: colorData.imgSrc,
      imgDesc: colorData.desc,
      imgListen: colorData.listen,

      postsDisplay: postsDisplay,
    }
    resolve(mainTemplateData)
  })
}

async function getPostsDisplay(activeTabColorHex, activeTabId, activeTabTextColor) {
  return new Promise(async function (resolve, reject) {
    let postsDisplay = []
    var cursor = db.collection('posts').find();
    cursor.each(function (err, item) {
      // If the item is null then the cursor is exhausted/empty and closed
      if (item == null) {
        //console.log('cursor item = null')
        resolve(postsDisplay)
        return;
      }
      // otherwise, do something with the item
      allBlogPosts.push(item)
      let tempObj = null;
      if (activeTabId == item._id) {
        tempObj = { 'title': item.title, 'id': item._id, 'activeTabTextColor': activeTabTextColor, 'activeTabColor': activeTabColorHex, 'activeTab': 'true' }
      } else {
        tempObj = { 'title': item.title, 'id': item._id }
      }
      //console.log('tempObj = ', tempObj)
      postsDisplay.push(tempObj)
    });

  })
}

//return pageColors
async function getColorData() {
  return new Promise(async function (resolve, reject) {
    let randomImg = await getRandomImg('static/assets/aesthetic-images/')
    let imgPath = `static/assets/aesthetic-images/${randomImg}`
    console.log('img = ', imgPath)

    //get color swatches
    var swatches = await Vibrant.from(imgPath).getPalette()
    //format rbg and swatch type into list
    let colors = {}
    for (const [key, value] of Object.entries(swatches)) {
      //get rgb color value
      let colorValue = value.rgb
      //convert to hex color value
      let hexColor = rgbToHex(colorValue)
      //construct object
      var keyName = `${key}`
      colors[keyName] = { 'hex': hexColor, 'rgb': colorValue }
    }
    console.log('color stuff fine, now getting metadata')
    //get source info
    let imgMetadata = await getImgMetadata(randomImg)

    resolve({
      colors: colors,
      imgPath: imgPath,
      filename: randomImg,
      imgSrc: imgMetadata.title,
      listen: imgMetadata.listen,
    })
  })
}

/*
   Helper functions
*/

function getReadableTextColor(inputRGBcolor) {
  if (((inputRGBcolor[0]) * 0.299 + (inputRGBcolor[1]) * 0.587 + (inputRGBcolor[2]) * 0.114) > 186) {
    return ("#000000")
  } else {
    return ("#ffffff")
  }
}

function LightenDarkenColor(col, amt) {

  var usePound = false;

  if (col[0] == "#") {
    col = col.slice(1);
    usePound = true;
  }

  var num = parseInt(col, 16);

  var r = (num >> 16) + amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  var b = ((num >> 8) & 0x00FF) + amt;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  var g = (num & 0x0000FF) + amt;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);

}

function invertColor(hexTripletColor) {
  var color = hexTripletColor;
  color = color.substring(1);           // remove #
  color = parseInt(color, 16);          // convert to integer
  color = 0xFFFFFF ^ color;             // invert three bytes
  color = color.toString(16);           // convert to hex
  color = ("000000" + color).slice(-6); // pad with leading zeros
  color = "#" + color;                  // prepend #
  return color;
}

//convert rgb string to hex
function rgbToHex(color) {
  return "#" + componentToHex(parseInt(color[0])) + componentToHex(parseInt(color[1])) + componentToHex(parseInt(color[2]));
}

//convert to int to hex
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function getImgMetadata(imgFilename) {
  return new Promise(async function (resolve, reject) {
    const exif = require('exif-parser')
    const fs = require('fs')
    let pathOneFolderUp = __dirname.split('/')
    let filepath = `${__dirname}/../static/assets/aesthetic-images/${imgFilename}`
    console.log('get metadata')
    try{
      const buffer = fs.readFileSync(filepath)
      const parser = exif.create(buffer)
      const result = parser.parse()
      resolve({'title':result.tags.ImageDescription, 'listen':'tempListenUrl'})
    }catch(err){
      console.log('there was an err getting this img metadata, err = ', err)
      resolve({'title':"", 'listen':'tempListenUrl'})
    }

  });
}

//return random image filename from path
function getRandomImg(path) {
  return new Promise(async function (resolve, reject) {
    var fs = require('fs');
    var files = fs.readdirSync('static/assets/aesthetic-images/')
    /* now files is an Array of the name of the files in the folder and you can pick a random name inside of that array */
    let chosenFile = files[Math.floor(Math.random() * files.length)]
    resolve(chosenFile)
  })
}

module.exports = app;

