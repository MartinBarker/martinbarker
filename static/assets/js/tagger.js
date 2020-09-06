$(document).ready(function () {
    
    //drag and drop code
    let dropArea = document.getElementById('drop-area')
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false)
    })
    function preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation()
    }
    ;['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false)
    })
    ;['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false)
    })
    function highlight(e) {
        dropArea.classList.add('highlight')
    }
    function unhighlight(e) {
        dropArea.classList.remove('highlight')
    }
    dropArea.addEventListener('drop', handleDrop, false)
    async function handleDrop(e) {
        let dt = e.dataTransfer
        let files = dt.files
        //generate and display timestamped tracklist data
        let taggerData = await getFileTaggerData(files)
        displayData(taggerData)
        //generate and display metadata tags
        let discogsTaggerData = await generateDiscogsFileTags(files) 
        displayMetadataTags(discogsTaggerData)
    }

    //function to make sure hitting 'enter' key submits input box
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            document.getElementById("urlInputButton").click();
            return false;
        }
    });

    //if select all is clicked
    $('#selectAll').on('click', function () {
        console.log(';select all')

        if (document.getElementById('selectAll').checked == true) {
            document.getElementById('releaseArtistsCheckbox').checked = true
            document.getElementById('releaseInfoCheckbox').checked = true
            document.getElementById('tracklistCheckbox').checked = true
            document.getElementById('combinationsCheckbox').checked = true
            prepUpdateTagsBox()
        } else {
            document.getElementById('releaseArtistsCheckbox').checked = false
            document.getElementById('releaseInfoCheckbox').checked = false
            document.getElementById('tracklistCheckbox').checked = false
            document.getElementById('combinationsCheckbox').checked = false
            prepUpdateTagsBox()
        }



    })

    //if tagger options change
    $(".taggerOptions").change(function () {
        console.log('taggerOptions chanmged, globalTaggerData = ', globalTaggerData)
        if (globalTaggerData) {
            displayData(globalTaggerData)
        } else {

        }
    });

    //if files are selected functions
    $("#file").change(async function (e) {
        var file = e.currentTarget.files[0];
        var songs = e.currentTarget.files;
        //generate and display tracklisted timstamp
        let taggerData = await getFileTaggerData(songs)
        displayData(taggerData)
        //generate and display metadata tags
        let discogsTaggerData = await generateDiscogsFileTags(songs) 
        displayMetadataTags(discogsTaggerData)

        
    });

    //convert files to tagger data
    async function getFileTaggerData(songs){
        return new Promise(async function (resolve, reject) {
            var numberOfSongs = songs.length;
            var startTime = "x"
            var endTime = "z"
            var startTimeSeconds = 0
            var endTimeSeconds = 0
            var taggerData = []
            for (i = 0; i < numberOfSongs; i++) {
                let songLength = await getSongLength(songs[i], i);
                let songTitle = await getSongTitle(songs[i], i);
    
                var endTimeSeconds = startTimeSeconds + songLength
    
                //convert seconds to minutes 
                startTime = convertSecondsToTimestamp(startTimeSeconds);
    
                //convert seconds to minutes
                endTime = convertSecondsToTimestamp(endTimeSeconds);
    
                var trackData = { title: songTitle, startTime: startTime, endTime: endTime }
                taggerData.push(trackData)
    
                var startTimeSeconds = endTimeSeconds
            }
            resolve(taggerData)
        })
    }

});

//global vars
let globalTaggerData = null;
let tagsJsonGlobal = null;
let tagsJsonDisplay = null;

async function displayMetadataTags(tags){
    //reset table slider values
    document.getElementById('releaseArtistsSlider').value = 100;
    document.getElementById('releaseArtistsSliderValue').innerHTML = `100%`;
    document.getElementById('releaseInfoSlider').value = 100;
    document.getElementById('releaseInfoSliderValue').innerHTML = `100%`;
    document.getElementById('tracklistSlider').value = 100;
    document.getElementById('tracklistSliderValue').innerHTML = `100%`;
    document.getElementById('combinationsSlider').value = 100;
    document.getElementById('combinationsSliderValue').innerHTML = `100%`;
    
    //store as global variables
    tagsJsonGlobal = tags;
    tagsJsonDisplay = tags;

    //set textbox palceholder to equal nothing
    document.getElementById("tagsBox").placeholder = "";

    //convert tags json object to comma seperated string var
    var tagsAll = getAllTags(tags);

    //get all checkbox and slider values
    var releaseArtistsCheckboxValue = $('.releaseArtistsCheckbox:checked').val();
    var releaseArtistsSliderValue = $('.releaseArtistsSlider').val();

    var releaseInfoCheckboxValue = $('.releaseInfoCheckbox:checked').val();
    var releaseInfoSliderValue = $('.releaseInfoSlider').val();

    var tracklistCheckboxValue = $('.tracklistCheckbox:checked').val();
    var tracklistSliderValue = $('.tracklistSlider').val();

    var combinationsCheckboxValue = $('.combinationsCheckbox:checked').val();
    var combinationsSliderValue = $('.combinationsSlider').val();

    //update display box based on checkbox and slider values
    updateTagsBox(releaseArtistsCheckboxValue, releaseArtistsSliderValue, releaseInfoCheckboxValue, releaseInfoSliderValue, tracklistCheckboxValue, tracklistSliderValue, combinationsCheckboxValue, combinationsSliderValue);

    //set tags
    document.getElementById("tagsBox").value = tagsAll;
}

//display tagger data on the page
async function displayData(input) {
    globalTaggerData = input;
    let taggerDisplayOption1 = document.getElementById("taggerOption1").value
    let taggerDisplayOption2 = document.getElementById("taggerOption2").value
    let taggerDisplayOption3 = document.getElementById("taggerOption3").value
    let taggerDisplayOption4 = document.getElementById("taggerOption4").value

    let textResult = "Tracklist generated by http://tagger.site: &#13;&#10;"
    //select text box to display data
    for (let [key, value] of Object.entries(input)) {
        let startTime = value.startTime
        let endTime = value.endTime
        let title = value.title

        let textLine = ``
        //determine option1
        if (taggerDisplayOption1 == 'startTime') {
            textLine = `${startTime}`
        } else if (taggerDisplayOption1 == '(blank)') {
            textLine = `${textLine}`
        }

        //determine option2
        if (taggerDisplayOption2 == 'dash') {
            textLine = `${textLine} -`
        } else if (taggerDisplayOption1 == '(blank)') {
            textLine = `${textLine}`
        }

        //determine option3
        if (taggerDisplayOption3 == 'endTime') {
            textLine = `${textLine} ${endTime}`
        } else if (taggerDisplayOption1 == '(blank)') {
            textLine = `${textLine}`
        }

        //determine option4
        if (taggerDisplayOption4 == 'title') {
            textLine = `${textLine} ${title}`
        }

        //remove first char if it is blank
        if (textLine[0] == ' ') {
            textLine = textLine.substring(1);
        }

        //`${startTime} - ${endTime} : ${value.title}`  
        textResult = textResult + textLine + "&#13;&#10;"
    }
    document.getElementById("inputBox").innerHTML = textResult
}

//take an object with track times and titles and calculate the timestamped tracklist to display
async function getDiscogsTaggerData(tracklistData) {
    return new Promise(async function (resolve, reject) {
        var taggerData = []
        var startTimeSeconds = 0;
        var endTimeSeconds = 0;
        for (var i = 0; i < tracklistData.length; i++) {
            let isHeadingTrackBool = await isHeadingTrack(tracklistData[i])
            //if track is not a discogs 'heading' track
            if (!isHeadingTrackBool) {
                if (tracklistData[i].duration == "") {
                    taggerData = []
                    var trackData = { title: "Track durations not availiable on every track for this Discogs URL", startTime: "", endTime: "" }
                    taggerData.push(trackData)
                    break
                } else {

                    if ((tracklistData[i].duration.toString(2)).includes(":")) {
                        var trackTimeSeconds = moment.duration(tracklistData[i].duration).asMinutes()
                    } else {
                        var trackTimeSeconds = tracklistData[i].duration
                    }

                    var trackTimeMinutes = new Date(trackTimeSeconds * 1000).toISOString().substr(11, 8);
                    endTimeSeconds = parseFloat(endTimeSeconds) + parseFloat(trackTimeSeconds)


                    //add data to object
                    var trackData = { title: tracklistData[i].title, startTime: secondsToTimestamp(startTimeSeconds), endTime: secondsToTimestamp(endTimeSeconds) }
                    taggerData.push(trackData)

                    //end of for loop cleanup
                    startTimeSeconds = startTimeSeconds + trackTimeSeconds

                }

            }

        }

        resolve(taggerData)

    });
}

//call this function when the user clicks 'Submit' on the Discogs URL Form input
async function submitDiscogsURL(input) {
    //parse release id from url
    var urlArr = input.split('/');
    var discogsListingType = urlArr[urlArr.length - 2];
    var discogsListingCode = urlArr[urlArr.length - 1];
    //get data from discogs API
    let discogsData = await getDiscogsData(discogsListingType, discogsListingCode)
    //generate discogs tags
    generateDiscogsURLTags(discogsData)

    //get tracklist from discogsData
    let discogsTracklist = discogsData.tracklist
    //if tracklistData is valid, get taggerData
    if (discogsTracklist != 'error') {
        let taggerData = await getDiscogsTaggerData(discogsTracklist)
        displayData(taggerData)
    }
}

//make discogs api call
async function getDiscogsData(discogsListingType, discogsListingCode) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: "https://api.discogs.com/" + discogsListingType + 's/' + discogsListingCode,
            type: 'GET',
            contentType: "application/json",
            success: function (data) {
                resolve(data)
            },
            error: function (error) { // error callback 
                resolve("error")
            }
        })
    });
}

async function discogsAPIQuery(queryURL) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: queryURL,
            type: 'GET',
            contentType: "application/json",
            success: function (data) {
                resolve(data)
            },
            error: function (error) {
                resolve("error")
            }
        })
    });
}

//copy text to clipboard
function copyToClipboard(elementID) {

    /* Get the text field */
    var copyText = document.getElementById(`${elementID}`);

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

}

//discogstagger file submit generate tags
async function generateDiscogsFileTags(songs){
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: "getFileMetadataTags",
            type: 'POST',
            data:{
                songs: 'songs',
            },
            success: function (resp) {
                resolve(resp)
            },
            error: function (error) { 
                resolve("error")
            }
        })
    })
}

//discogstagger url submit generate tags
async function generateDiscogsURLTags(discogsReleaseData) {
    //get releaseArtist tags
    let releaseArtistTags = await getArtistTags(discogsReleaseData)

    //get releaseInfo tags
    let releaseInfoTags = await getReleaseInfoTags(discogsReleaseData)

    //get tracklist tags
    let tracklistTags = await getTracklistTags(discogsReleaseData)

    //get combinations tags
    let combinationsTags = await getCombinationTags(discogsReleaseData)

    //combine tags into json results
    var jsonResults = {
        'tags': {
            'releaseArtist': releaseArtistTags,
            'releaseInfo': releaseInfoTags,
            'tracklist': tracklistTags,
            'combinations': combinationsTags
        }
    };

    displayMetadataTags(jsonResults)
}

//discogstagger: generate comma seperated tags from a json object
function getAllTags(jsonObj) {

    //get count of elements in 'tags'
    var count = Object.keys(jsonObj.tags).length;
    var allTags = "";
    for (var key in jsonObj.tags) {
        if (jsonObj.tags.hasOwnProperty(key)) {
            //console.log(key + " -> " + jsonObj.tags[key]);
            if (allTags.includes(jsonObj.tags[key])) {

            } else {
                allTags = allTags + jsonObj.tags[key] + ",";
            }
        }
    }
    return allTags;
}

//discogstagger: update tag display box
function updateTagsBox(releaseArtistsCheckboxValue, releaseArtistsSliderValue, releaseInfoCheckboxValue, releaseInfoSliderValue, tracklistCheckboxValue, tracklistSliderValue, combinationsCheckboxValue, combinationsSliderValue) {

    var tags = "";

    if (releaseArtistsCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.releaseArtist, (releaseArtistsSliderValue / 100)).tags;

        document.getElementById('releaseArtistsNumber').innerHTML = `${addTags(tagsJsonGlobal.tags.releaseArtist, (releaseArtistsSliderValue / 100)).tags.length} chars`;
    } else {
        document.getElementById('releaseArtistsNumber').innerHTML = "0 chars"
    }

    if (releaseInfoCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.releaseInfo, (releaseInfoSliderValue / 100)).tags;
        document.getElementById('releaseInfoNumber').innerHTML = `${addTags(tagsJsonGlobal.tags.releaseInfo, (releaseInfoSliderValue / 100)).tags.length} chars`;
    } else {
        document.getElementById('releaseInfoNumber').innerHTML = "0 chars"
    }

    if (tracklistCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100)).tags;
        document.getElementById('tracklistNumber').innerHTML = `${addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100)).tags.length} chars`;
    } else {
        document.getElementById('tracklistNumber').innerHTML = "0 chars"
    }

    if (combinationsCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100)).tags;
        document.getElementById('combinationsNumber').innerHTML = `${addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100)).tags.length} chars`;
    } else {
        document.getElementById('combinationsNumber').innerHTML = "0 chars"
    }

    document.getElementById("tagsBox").value = tags;
    document.getElementById("charCount").innerText = "Number of characters: " + tags.length.toString();
}

//remove any numbers inside parenthesis like (2)
function removeNumberParenthesis(input) {
    var regEx = /\(([\d)]+)\)/; //get all numbers within parenthesis
    var matches = regEx.exec(input);
    if (matches) {

        //remove parenthesis number
        var ret = input.replace(matches[0], '')
        //remove last char
        ret = ret.slice(0, -1);
        //console.log(`${input}, matches = `, matches, ", ret = ", ret)
        return ret
    } else {
        return input
    }

}

//discogstagger: get tags from json
async function getCombinationTags(discogsReleaseData) {
    return new Promise(async function (resolve, reject) {
        let comboTags = []
        //get vars:
        //title
        let title = removeNumberParenthesis(discogsReleaseData.title)
        //year
        let year = discogsReleaseData.year
        //artist_sort
        let artist = removeNumberParenthesis(discogsReleaseData.artists_sort)
        //style
        let style = ''
        if (discogsReleaseData.styles) { style = discogsReleaseData.styles[0] }
        //genre
        let genre = ''
        if (discogsReleaseData.genres) { genre = discogsReleaseData.genres[0] }

        //create tags to combine and push:
        comboTags.push(`${title} ${year}`)
        comboTags.push(`${title} ${artist}`)
        comboTags.push(`${artist} ${year}`)
        comboTags.push(`${title} ${style} ${genre}`)

        resolve(comboTags)
    })
}

async function getTracklistTags(discogsReleaseData) {
    return new Promise(async function (resolve, reject) {
        let tracklistTags = []
        if (discogsReleaseData.tracklist) {
            for (var x = 0; x < discogsReleaseData.tracklist.length; x++) {
                if (discogsReleaseData.tracklist[x].title) {
                    tracklistTags.push(discogsReleaseData.tracklist[x].title)
                }
            }
        }
        //remove duplicates from list
        let uniqueTracklistTags = [...new Set(tracklistTags)];
        //remove any blank strings
        var filtered = uniqueTracklistTags.filter(function (el) {
            return el != null;
        });
        resolve(filtered)
    })
}

async function getReleaseInfoTags(discogsReleaseData) {
    return new Promise(async function (resolve, reject) {
        let releaseInfoTags = []
        //year
        if (discogsReleaseData.year) {
            releaseInfoTags.push(discogsReleaseData.year)
        }
        //title
        if (discogsReleaseData.title) {
            releaseInfoTags.push(discogsReleaseData.title)
        }
        //country
        if (discogsReleaseData.country) {
            releaseInfoTags.push(discogsReleaseData.country)
        }
        //genres
        if (discogsReleaseData.genres) {
            releaseInfoTags = releaseInfoTags.concat(discogsReleaseData.genres)
        }
        //styles
        if (discogsReleaseData.styles) {
            releaseInfoTags = releaseInfoTags.concat(discogsReleaseData.styles)
        }
        //formats
        if (discogsReleaseData.formats) {
            for (var g = 0; g < discogsReleaseData.formats.length; g++) {
                //descriptions
                if (discogsReleaseData.formats[g].descriptions) {
                    releaseInfoTags = releaseInfoTags.concat(discogsReleaseData.formats[g].descriptions)
                }
                //name
                if (discogsReleaseData.formats[g].name) {
                    //releaseInfoTags.push(discogsReleaseData.title.name)
                }
            }
        }
        //labels
        if (discogsReleaseData.labels) {
            for (var h = 0; h < discogsReleaseData.labels.length; h++) {
                if (discogsReleaseData.labels[h].name) {
                    releaseInfoTags.push(discogsReleaseData.labels[h].name)
                }
            }
        }
        //companies
        if (discogsReleaseData.companies) {
            for (var h = 0; h < discogsReleaseData.companies.length; h++) {
                if (discogsReleaseData.companies[h].name) {
                    releaseInfoTags.push(discogsReleaseData.companies[h].name)
                }
            }
        }

        //remove duplicates from list
        let uniqueReleaseInfoTags = [...new Set(releaseInfoTags)];
        //remove any blank strings
        var filtered = uniqueReleaseInfoTags.filter(function (el) {
            return el != null;
        });
        resolve(filtered)
    })
}

async function getArtistTags(discogsReleaseData) {
    return new Promise(async function (resolve, reject) {
        var artistTags = []

        //if artists_sort exists, push that
        if (discogsReleaseData.artists_sort) {
            artistTags.push(removeNumberParenthesis(discogsReleaseData.artists_sort))
        }

        //for each artist in 'artists[]' object
        if (discogsReleaseData.artists) {
            for (var i = 0; i < discogsReleaseData.artists.length; i++) {
                //push artist name
                artistTags.push(removeNumberParenthesis(discogsReleaseData.artists[i].name))

                //if anv exists, push that
                if (discogsReleaseData.artists[i].anv) {
                    artistTags.push(removeNumberParenthesis(discogsReleaseData.artists[i].anv))
                }

                //if artist is not 'Various', get more info
                if (discogsReleaseData.artists[i].name != "Various" && discogsReleaseData.artists[i].resource_url) {
                    let artistData = await discogsAPIQuery(discogsReleaseData.artists[i].resource_url)
                    //if namevariations exist, add those to artistTags
                    if (artistData.namevariations) {
                        artistTags = artistTags.concat(artistData.namevariations)
                    }

                    //if groups exist
                    if (artistData.groups) {
                        for (var q = 0; q < artistData.groups.length; q++) {
                            //push group name
                            artistTags.push(removeNumberParenthesis(artistData.groups[q].name))
                            //if anv exists, push that
                            if (artistData.groups[q].anv) {
                                artistTags.push(removeNumberParenthesis(artistData.groups[q].anv))
                            }
                        }
                    }

                    //if members exist
                    if (artistData.members) {
                        //for each member
                        for (var z = 0; z < artistData.members.length; z++) {
                            //push name
                            artistTags.push(removeNumberParenthesis(artistData.members[z].name))

                            //push anv if it exists
                            if (artistData.members[z].anv) {
                                artistTags.push(removeNumberParenthesis(artistData.members[z].anv))
                            }

                            /*
                            //get more info on that member if possible
                            if(artistData.members[z].resource_url){
                                let memberArtistData = await discogsAPIQuery(artistData.members[z].resource_url)
                                //if namevariations exist, add that to artistTags
                                if(memberArtistData.namevariations){
                                    artistTags = artistTags.concat(memberArtistData.namevariations)
                                }
                                //if groups exist, add that 
                                if(memberArtistData.groups){
                                    //for each group
                                    for(var x = 0; x < memberArtistData.groups.length; x++){
                                        //push group name
                                        artistTags.push(removeNumberParenthesis(memberArtistData.groups[x].name))
                                        
                                    }
                                }
                                //if aliases exist
                                if(memberArtistData.aliases){
                                    for(var y = 0; y < memberArtistData.aliases.length; y++){
                                        artistTags.push(removeNumberParenthesis(memberArtistData.aliases[y].name))
                                        if(memberArtistData.aliases[y].anv){
                                            artistTags.push(removeNumberParenthesis(memberArtistData.aliases[y].anv))
                                        }
                                    }
                                }
                            }
                            */
                        }
                    }

                    //if aliases exist
                    if (artistData.aliases) {
                        for (var y = 0; y < artistData.aliases.length; y++) {
                            artistTags.push(removeNumberParenthesis(artistData.aliases[y].name))
                            removeNumberParenthesis(artistData.aliases[y].name)
                            if (artistData.aliases[y].anv) {
                                artistTags.push(removeNumberParenthesis(artistData.aliases[y].anv))
                            }
                        }
                    }
                }
            }
        }

        //if extraartists[] exists
        if (discogsReleaseData.extraartists) {
            //for each artist in extraartists
            for (var i = 0; i < discogsReleaseData.extraartists.length; i++) {
                //push name
                artistTags.push(removeNumberParenthesis(discogsReleaseData.extraartists[i].name))

                //if anv exists, push that too
                if (discogsReleaseData.extraartists[i].anv) {
                    artistTags.push(removeNumberParenthesis(discogsReleaseData.extraartists[i].anv))
                }

                /*
                //get extra info if possible
                if(discogsReleaseData.extraartists[i].resource_url){
                    let extraArtistData = await discogsAPIQuery(discogsReleaseData.extraartists[i].resource_url)
                    //if namevariations exist, add those to artistTags
                    if(extraArtistData.namevariations){
                        artistTags = artistTags.concat(extraArtistData.namevariations)
                    }

                    //if groups exist
                    if(extraArtistData.groups){
                        for(var q = 0; q < extraArtistData.groups.length; q++){
                            //push group name
                            artistTags.push(removeNumberParenthesis(extraArtistData.groups[q].name))
                            //if anv exists, push that
                            if(extraArtistData.groups[q].anv){
                                extraArtistData.push(removeNumberParenthesis(extraArtistData.groups[q].anv))
                            }
                        }
                    }

                    //if members exist
                    if(extraArtistData.members){
                        //for each member
                        for(var z = 0; z < extraArtistData.members.length; z++){
                            //push name
                            artistTags.push(removeNumberParenthesis(extraArtistData.members[z].name))

                            //push anv if it exists
                            if(extraArtistData.members[z].anv){
                                artistTags.push(removeNumberParenthesis(extraArtistData.members[z].anv))
                            }

                            //get more info on that member if possible
                            if(extraArtistData.members[z].resource_url){
                                let memberArtistData = await discogsAPIQuery(extraArtistData.members[z].resource_url)
                                //if namevariations exist, add that to artistTags
                                if(memberArtistData.namevariations){
                                    artistTags = artistTags.concat(memberArtistData.namevariations)
                                }
                                //if groups exist, add that 
                                if(memberArtistData.groups){
                                    //for each group
                                    for(var x = 0; x < memberArtistData.groups.length; x++){
                                        //push group name
                                        artistTags.push(removeNumberParenthesis(memberArtistData.groups[x].name))
                                        
                                    }
                                    
                                }
                            }
                        }
                    }

                }
                */
            }
        }

        //get artists / extrartists from tracklist
        if (discogsReleaseData.tracklist) {
            for (var i = 0; i < discogsReleaseData.tracklist; i++) {
                //if track in tracklist has extraartists data
                if (discogsReleaseData.tracklist[i].extraartists) {
                    for (var x = 0; x < discogsReleaseData.tracklist[i].extraartists; x++) {
                        artistTags.push(removeNumberParenthesis(discogsReleaseData.tracklist[i].extraartists[x].name))
                    }
                }
            }
        }

        //remove duplicates from list
        let uniqueArtistTags = [...new Set(artistTags)];
        //remove empty strings
        var filtered = uniqueArtistTags.filter(function (el) {
            return el != null;
        });
        resolve(filtered);
    })
}

function addTags(tags, percentToInclude) {
    var tempTags = "";

    var numberOfTagsAvailiable = tags.length;
    var numberOfTagsToDisplay = numberOfTagsAvailiable * percentToInclude;
    numberOfTagsToDisplay = ~~numberOfTagsToDisplay;
    for (var i = 0; i < numberOfTagsToDisplay; i++) {
        tempTags = tempTags + tags[i] + ","
    }
    return { tags: tempTags, length: numberOfTagsToDisplay };
}

function prepUpdateTagsBox() {
    var releaseArtistsCheckboxValue = $('.releaseArtistsCheckbox:checked').val();
    var releaseArtistsSliderValue = $('.releaseArtistsSlider').val();

    var releaseInfoCheckboxValue = $('.releaseInfoCheckbox:checked').val();
    var releaseInfoSliderValue = $('.releaseInfoSlider').val();

    var tracklistCheckboxValue = $('.tracklistCheckbox:checked').val();
    var tracklistSliderValue = $('.tracklistSlider').val();

    var combinationsCheckboxValue = $('.combinationsCheckbox:checked').val();
    var combinationsSliderValue = $('.combinationsSlider').val();

    //updateTagsBox(releaseArtistsCheckboxValue, releaseArtistsSliderValue, releaseInfoCheckboxValue, releaseInfoSliderValue, tracklistCheckboxValue, tracklistSliderValue, publisherNotesCheckboxValue, publisherNotesSliderValue, combinationsCheckboxValue, combinationsSliderValue);
    updateTagsBox(releaseArtistsCheckboxValue, releaseArtistsSliderValue, releaseInfoCheckboxValue, releaseInfoSliderValue, tracklistCheckboxValue, tracklistSliderValue, combinationsCheckboxValue, combinationsSliderValue);

}

///////////////////////////////////////////////////////////////////////////////
// used??


async function convertFileInfoToTracklistData(songs) {
    return new Promise(async function (resolve, reject) {
        try {
            var tracklistData = []
            for (i = 0; i < songs.length; i++) {
                let songLength = await getSongLength(songs[i], i);
                let songTitle = await getSongTitle(songs[i], i);
                var trackData = { duration: songLength, title: songTitle }
                tracklistData.push(trackData)

            }

            resolve(tracklistData)
        } catch{
            resolve('error')
        }
    });
}

async function isHeadingTrack(track) {
    return new Promise(function (resolve, reject) {
        for (var key in track) {
            if (track.hasOwnProperty(key)) {
                if (key.includes("type") && track[key] == 'heading') {
                    resolve(true)
                }
            }
        }
        resolve(false)
    })
}

function secondsToTimestamp(input) {
    var temp = new Date(input * 1000).toISOString().substr(11, 8);
    return temp
}

function convertSecondsToTimestamp(seconds) {
    var duration = moment.duration(seconds, "seconds");
    var time = "";
    var hours = duration.hours();
    if (hours > 0) { time = hours + ":"; }
    var append_s = ""
    var append_m = ""
    if (duration.seconds() < 10) {
        append_s = "0"
    }
    if (duration.minutes() < 10) {
        append_m = "0"
    }
    total_string = time + append_m + duration.minutes() + ":" + append_s + duration.seconds();
    return total_string;
}

function getSongLength(song, i) {
    return new Promise(function (resolve, reject) {
        //create objectURL and audio object for songs[i]
        objectURL = URL.createObjectURL(song);
        mySound = new Audio([objectURL])
        var filename = song.name;
        //when song metadata is loaded:
        mySound.addEventListener("canplaythrough", function (e) {
            var seconds = e.currentTarget.duration;
            resolve(seconds)
        });

    });
}

function getSongTitle(song, i) {
    return new Promise(function (resolve, reject) {

        var filename = song.name;
        var n = 0
        n = song.name.lastIndexOf(".")
        filename = filename.substr(0, filename.lastIndexOf("."))

        resolve(filename)
    });
}
