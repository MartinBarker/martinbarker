var tagsJsonGlobal = null;
var tagsJsonDisplay = null;

$(document).ready(function () {
    //function to make sure hitting 'enter' key submits input box
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            document.getElementById("urlInputButton").click();
            return false;
        }
    });



    //when release artist slider changes
    $('#releaseArtistsSlider').on('input', function() {
        prepUpdateTagsBox()
    })
    //when releaseInfo slider changes
    $('#releaseInfoSlider').on('input', function() {
        prepUpdateTagsBox()
    })
    //when tracklist slider changes
    $('#tracklistSlider').on('input', function() {
        prepUpdateTagsBox()
    })
    //when combinations slider changes
    $('#combinationsSlider').on('input', function() {
        prepUpdateTagsBox()
    })


    //releaseArtist precentage update : declarations
    releaseArtist_i = document.getElementById('releaseArtistsSlider');
    releaseArtist_o = document.getElementById('releaseArtistsSliderValue');
    releaseArtist_o.innerHTML = releaseArtist_i.value;
    //setting initial value
    releaseArtist_o.innerHTML = releaseArtist_i.value.toString() + "%";
    //listening and setting when slider changes
    releaseArtist_i.addEventListener('input', function () {
        releaseArtist_o.innerHTML = releaseArtist_i.value.toString() + "%";
    }, false);

    //releaseInfo precentage update : declarations
    releaseInfo_i = document.getElementById('releaseInfoSlider');
    releaseInfo_o = document.getElementById('releaseInfoSliderValue');
    releaseInfo_o.innerHTML = releaseInfo_i.value;
    //setting initial value
    releaseInfo_o.innerHTML = releaseInfo_i.value.toString() + "%";
    //listening and setting when slider changes
    releaseInfo_i.addEventListener('input', function () {
        releaseInfo_o.innerHTML = releaseInfo_i.value.toString() + "%";
    }, false);

    //tracklist precentage update : declarations
    tracklist_i = document.getElementById('tracklistSlider');
    tracklist_o = document.getElementById('tracklistSliderValue');
    tracklist_o.innerHTML = tracklist_i.value;
    //setting initial value
    tracklist_o.innerHTML = tracklist_i.value.toString() + "%";
    //listening and setting when slider changes
    tracklist_i.addEventListener('input', function () {
        tracklist_o.innerHTML = tracklist_i.value.toString() + "%";
    }, false);

    //combinations precentage update : declarations
    combinations_i = document.getElementById('combinationsSlider');
    combinations_o = document.getElementById('combinationsSliderValue');
    combinations_o.innerHTML = combinations_i.value;
    //setting initial value
    combinations_o.innerHTML = combinations_i.value.toString() + "%";
    //listening and setting when slider changes
    combinations_i.addEventListener('input', function () {
        combinations_o.innerHTML = combinations_i.value.toString() + "%";
    }, false);

})

async function getTags(input) {
    console.log("getTags, input = ", input)

    //reset table slider values
    document.getElementById('releaseArtistsSlider').value = 100;
    document.getElementById('releaseArtistsSliderValue').innerHTML = `100%`;
    document.getElementById('releaseInfoSlider').value = 100;
    document.getElementById('releaseInfoSliderValue').innerHTML = `100%`;
    document.getElementById('tracklistSlider').value = 100;
    document.getElementById('tracklistSliderValue').innerHTML = `100%`;
    document.getElementById('combinationsSlider').value = 100;
    document.getElementById('combinationsSliderValue').innerHTML = `100%`;

    //parse release id from url
    var urlArr = input.split('/');
    var discogsListingType = urlArr[urlArr.length - 2];
    var discogsListingCode = urlArr[urlArr.length - 1];

    //get tracklistData from discogs API
    let discogsReleaseData = await discogsAPIQuery("https://api.discogs.com/" + discogsListingType + 's/' + discogsListingCode) 
    //console.log("discogsReleaseData = ", discogsReleaseData)

    //run all these promises synchronously??

    //get releaseArtist tags
    let releaseArtistTags = await getArtistTags(discogsReleaseData) 

    //get releaseInfo tags
    let releaseInfoTags = await getReleaseInfoTags(discogsReleaseData)

    //get tracklist tags
    let tracklistTags = await getTracklistTags(discogsReleaseData)

    //get combinations tags
    let combinationsTags = await getCombinationTags(discogsReleaseData)

    var jsonResults = {
        'tags':{
            'releaseArtist': releaseArtistTags, 
            'releaseInfo':releaseInfoTags, 
            'tracklist':tracklistTags, 
            'combinations':combinationsTags
        }};
    console.log("jsonResults = ", jsonResults)

    //store as global variable?
    tagsJsonGlobal = jsonResults;
    tagsJsonDisplay = jsonResults;

    //convert tags json object to comma seperated string var
    var tagsAll = getAllTags(jsonResults);
    //console.log("tagsAll = ", tagsAll);

    var releaseArtistsCheckboxValue = $('.releaseArtistsCheckbox:checked').val();
    var releaseArtistsSliderValue = $('.releaseArtistsSlider').val();

    var releaseInfoCheckboxValue = $('.releaseInfoCheckbox:checked').val();
    var releaseInfoSliderValue = $('.releaseInfoSlider').val();

    var tracklistCheckboxValue = $('.tracklistCheckbox:checked').val();
    var tracklistSliderValue = $('.tracklistSlider').val();

    var combinationsCheckboxValue = $('.combinationsCheckbox:checked').val();
    var combinationsSliderValue = $('.combinationsSlider').val();

    updateTagsBox(releaseArtistsCheckboxValue, releaseArtistsSliderValue, releaseInfoCheckboxValue, releaseInfoSliderValue, tracklistCheckboxValue, tracklistSliderValue, combinationsCheckboxValue, combinationsSliderValue);

    //set tags
    document.getElementById("tagsBox").value = tagsAll;

    return false;
}

async function getCombinationTags(discogsReleaseData){
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
        let style = discogsReleaseData.styles[0]
        //genre
        let genre = discogsReleaseData.genres[0]

        //create tags to combine and push:
        comboTags.push(`${title} ${year}`)
        comboTags.push(`${title} ${artist}`)
        comboTags.push(`${artist} ${year}`)
        comboTags.push(`${title} ${style} ${genre}`)
        
        resolve(comboTags)
    })
}

async function getTracklistTags(discogsReleaseData){
    return new Promise(async function (resolve, reject) {
        let tracklistTags = []
        if(discogsReleaseData.tracklist){
            for(var x = 0; x < discogsReleaseData.tracklist.length; x++){
                if(discogsReleaseData.tracklist[x].title){
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

async function getReleaseInfoTags(discogsReleaseData){
    return new Promise(async function (resolve, reject) {
        let releaseInfoTags = []
        //year
        if(discogsReleaseData.year){
            releaseInfoTags.push(discogsReleaseData.year)
        }
        //title
        if(discogsReleaseData.title){
            releaseInfoTags.push(discogsReleaseData.title)
        }
        //country
        if(discogsReleaseData.country){
            releaseInfoTags.push(discogsReleaseData.country)
        }
        //genres
        if(discogsReleaseData.genres){
            releaseInfoTags = releaseInfoTags.concat(discogsReleaseData.genres)
        }
        //styles
        if(discogsReleaseData.styles){
            releaseInfoTags = releaseInfoTags.concat(discogsReleaseData.styles)
        }
        //formats
        if(discogsReleaseData.formats){
            for(var g = 0; g < discogsReleaseData.formats.length; g++){
                //descriptions
                if(discogsReleaseData.formats[g].descriptions){
                    releaseInfoTags = releaseInfoTags.concat(discogsReleaseData.formats[g].descriptions)
                }
                //name
                if(discogsReleaseData.formats[g].name){
                    //releaseInfoTags.push(discogsReleaseData.title.name)
                }
            }
        }
        //labels
        if(discogsReleaseData.labels){
            for(var h = 0; h < discogsReleaseData.labels.length; h++){
                if(discogsReleaseData.labels[h].name){
                    releaseInfoTags.push(discogsReleaseData.labels[h].name)
                }
            }
        }
        //companies
        if(discogsReleaseData.companies){
            for(var h = 0; h < discogsReleaseData.companies.length; h++){
                if(discogsReleaseData.companies[h].name){
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

async function getArtistTags(discogsReleaseData){
    return new Promise(async function (resolve, reject) {
        var artistTags = []
        
        //if artists_sort exists, push that
        if(discogsReleaseData.artists_sort){
            artistTags.push(removeNumberParenthesis(discogsReleaseData.artists_sort))
        }
        
        //for each artist in 'artists[]' object
        if(discogsReleaseData.artists){
            for(var i = 0; i < discogsReleaseData.artists.length; i++){
                //push artist name
                artistTags.push(removeNumberParenthesis(discogsReleaseData.artists[i].name))
                
                //if anv exists, push that
                if(discogsReleaseData.artists[i].anv){
                    artistTags.push(removeNumberParenthesis(discogsReleaseData.artists[i].anv))
                }

                //if artist is not 'Various', get more info
                if(discogsReleaseData.artists[i].name != "Various" && discogsReleaseData.artists[i].resource_url){
                    let artistData = await discogsAPIQuery(discogsReleaseData.artists[i].resource_url)
                    //if namevariations exist, add those to artistTags
                    if(artistData.namevariations){
                        artistTags = artistTags.concat(artistData.namevariations)
                    }

                    //if groups exist
                    if(artistData.groups){
                        for(var q = 0; q < artistData.groups.length; q++){
                            //push group name
                            artistTags.push(removeNumberParenthesis(artistData.groups[q].name))
                            //if anv exists, push that
                            if(artistData.groups[q].anv){
                                artistTags.push(removeNumberParenthesis(artistData.groups[q].anv))
                            }
                        }
                    }

                    //if members exist
                    if(artistData.members){
                        //for each member
                        for(var z = 0; z < artistData.members.length; z++){
                            //push name
                            artistTags.push(removeNumberParenthesis(artistData.members[z].name))

                            //push anv if it exists
                            if(artistData.members[z].anv){
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
                    if(artistData.aliases){
                        for(var y = 0; y < artistData.aliases.length; y++){
                            artistTags.push(removeNumberParenthesis(artistData.aliases[y].name))
                            removeNumberParenthesis(artistData.aliases[y].name)
                            if(artistData.aliases[y].anv){
                                artistTags.push(removeNumberParenthesis(artistData.aliases[y].anv))
                            }
                        }
                    }
                }
            }
        }

        //if extraartists[] exists
        if(discogsReleaseData.extraartists){
            //for each artist in extraartists
            for(var i = 0; i < discogsReleaseData.extraartists.length; i++){
                //push name
                artistTags.push(removeNumberParenthesis(discogsReleaseData.extraartists[i].name))

                //if anv exists, push that too
                if(discogsReleaseData.extraartists[i].anv){
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
        if(discogsReleaseData.tracklist){
            for(var i = 0; i < discogsReleaseData.tracklist; i++){
                //if track in tracklist has extraartists data
                if(discogsReleaseData.tracklist[i].extraartists){
                    for(var x = 0; x < discogsReleaseData.tracklist[i].extraartists; x++){
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

function removeNumberParenthesis(input){
    var regEx = /\(([\d)]+)\)/; //get all numbers within parenthesis
    var matches = regEx.exec(input);
    if(matches){
        
        //remove parenthesis number
        var ret = input.replace(matches[0], '')
        //remove last char
        ret = ret.slice(0, -1); 
        //console.log(`${input}, matches = `, matches, ", ret = ", ret)
        return ret
    }else{
        return input
    }

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


function copyToClipboard(element) {

    /* Get the text field */
    var copyText = document.getElementById("tagsBox");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

  }

// ~~~~~~~~~~~~~~~~~~~~~~~ OLD CODE BELOW ~~~~~~~~~~~~~~~ //

function ShortenBoxTo500(){
    var currentTags = document.getElementById("tagsBox").value;
    var trimmedString = currentTags.substring(0, 500);
    document.getElementById("tagsBox").value = trimmedString
    document.getElementById("charCount").innerText = "Number of characters: " + document.getElementById("tagsBox").value.length.toString();
}

function getValues(id) {
    return new Promise(async function (resolve, reject) {
        var tempVar = '';
        var dataVar = String(id);//'id=' + id;
        var csrftoken = getCookie('csrftoken');

        let successValue = await makeAjax(dataVar, csrftoken);

        //var decodedStr = decodeURIComponent(escape(successValue));

        //var parsed = JSON.parse(decodedStr)

        //var parsed = JSON.parse(successValue)

        //console.log("ppppppppppppppppppppparsed = " + parsed)

        resolve(successValue)

    });

}

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

function updateTagsBox(releaseArtistsCheckboxValue, releaseArtistsSliderValue, releaseInfoCheckboxValue, releaseInfoSliderValue, tracklistCheckboxValue, tracklistSliderValue, combinationsCheckboxValue, combinationsSliderValue) {
    //console.log("releaseArtists checkbox = ", releaseArtistsCheckboxValue, ". slider = ", releaseArtistsSliderValue)
    //console.log("releaseInfo checkbox = ", releaseInfoCheckboxValue, ". slider = ", releaseInfoSliderValue)
    //console.log("tracklist checkbox = ", tracklistCheckboxValue, ". slider = ", tracklistSliderValue)
    //console.log("combinations checkbox = ", combinationsCheckboxValue, ". slider = ", combinationsSliderValue)

    var tags = "";

    if (releaseArtistsCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.releaseArtist, (releaseArtistsSliderValue / 100)).tags;
        document.getElementById('releaseArtistsNumber').innerHTML = addTags(tagsJsonGlobal.tags.releaseArtist, (releaseArtistsSliderValue / 100)).length;
    }else{
        document.getElementById('releaseArtistsNumber').innerHTML = "0"
    }
    
    if (releaseInfoCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.releaseInfo, (releaseInfoSliderValue / 100)).tags;
        document.getElementById('releaseInfoNumber').innerHTML = addTags(tagsJsonGlobal.tags.releaseInfo, (releaseInfoSliderValue / 100)).length;
    }else{
        document.getElementById('releaseInfoNumber').innerHTML = "0"
    }

    if (tracklistCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100)).tags;
        document.getElementById('tracklistNumber').innerHTML = addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100)).length;
    }else{
        document.getElementById('tracklistNumber').innerHTML = "0"
    }

    if (combinationsCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100)).tags;
        document.getElementById('combinationsNumber').innerHTML = addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100)).length;
    }else{
        document.getElementById('combinationsNumber').innerHTML = "0"
    }

    document.getElementById("tagsBox").value = tags;
    document.getElementById("charCount").innerText = "Number of characters: " + tags.length.toString();
}

function addTags(tags, percentToInclude) {
    var tempTags = "";

    var numberOfTagsAvailiable = tags.length;
    var numberOfTagsToDisplay = numberOfTagsAvailiable * percentToInclude;
    numberOfTagsToDisplay = ~~numberOfTagsToDisplay;
    for (var i = 0; i < numberOfTagsToDisplay; i++) {
        tempTags = tempTags + tags[i] + ","
    }
    return {tags:tempTags, length:numberOfTagsToDisplay};
}


