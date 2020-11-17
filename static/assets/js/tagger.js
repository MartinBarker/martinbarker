$(document).ready(function () {
    var reader;
    checkFileAPI();
    //Check for the various File API support.
    function checkFileAPI() {
        console.log('checkFileAPI()')
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            reader = new FileReader();
            return true;
        } else {
            alert('The File APIs are not fully supported by your browser. Fallback required.');
            return false;
        }
    }

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


        var firstFile = files[0];
        let taggerData;
        //if first file filename ends with '.cue'
        if (firstFile.name.toUpperCase().substr(firstFile.name.length - 4) == (".CUE")) {
            var cueFileContents = await readText(e.dataTransfer)
            taggerData = await getCueTaggerData(cueFileContents)

        } else {
            var songs = e.currentTarget.files;
            //generate tracklisted timstamp
            taggerData = await getFileTaggerData(songs)
        }

        //display results
        displayData(taggerData)
        //generate and display metadata tags
        document.getElementById('tagsBox').value = "Metadata tags generation via files not currently supported :( Try using a Discogs URL"
        $("#tagsCharCount").text(`Copy 85 Chars to Clipboard`);
        //let discogsTaggerData = await generateDiscogsFileTags(files) 
        //displayMetadataTags(discogsTaggerData)
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
        displayData(globalTaggerData)
        if (globalTaggerData) {
            displayData(globalTaggerData)
        } else {

        }
    });

    //if files are selected functions
    $("#file").change(async function (e) {
        var firstFile = e.currentTarget.files[0];
        let taggerData;
        //if first file filename ends with '.cue'
        if (firstFile.name.toUpperCase().substr(firstFile.name.length - 4) == (".CUE")) {
            console.log('its a cue file')
            var cueFileContents = await readText(e.currentTarget)
            console.log('cueFileContents=', cueFileContents)
            taggerData = await getCueTaggerData(cueFileContents)

        } else {
            console.log("not a cue file")
            var songs = e.currentTarget.files;
            console.log('songs=', songs)
            //generate and display tracklisted timstamp
            taggerData = await getFileTaggerData(songs)
        }
        console.log('taggerData=', taggerData)
        displayData(taggerData)
        //generate and display metadata tags
        let discogsTaggerData = await generateDiscogsFileTags(songs)
        displayMetadataTags(discogsTaggerData)
        document.getElementById('tagsBox').value = "Metadata tags generation via files not currently supported :( Try using a Discogs URL"
        $("#tagsCharCount").text(`Copy 85 Chars to Clipboard`);





    });

    function readText(filePath) {
        return new Promise(async function (resolve, reject) {

            var output = ""; //placeholder for text output
            if (filePath.files && filePath.files[0]) {
                reader.onload = function (e) {
                    output = e.target.result;
                    resolve(output)
                };//end onload()
                reader.readAsText(filePath.files[0]);
            }//end if html5 filelist support
            else if (ActiveXObject && filePath) { //fallback to IE 6-8 support via ActiveX
                try {
                    reader = new ActiveXObject("Scripting.FileSystemObject");
                    var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
                    output = file.ReadAll(); //text contents of file
                    file.Close(); //close file "input stream"
                    resolve(output)
                } catch (e) {
                    if (e.number == -2146827859) {
                        alert('Unable to access local files due to browser security settings. ' +
                            'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' +
                            'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"');
                    }
                }
            }
            else { //this is where you could fallback to Java Applet, Flash or similar
                //resolve(false)
            }
            //resolve(true)

        })
    }

    //convert cue file to tagger data
    async function getCueTaggerData(cueStr) {
        return new Promise(async function (resolve, reject) {
            let splitTracksCue = cueStr.split('TRACK')

            let startTime, endTime;
            var startTimeSeconds = 0;
            var endTimeSeconds = 0;
            let taggerData = [];

            //for each track
            var cueFileTrackCount = 0;
            for (var x = 0; x < splitTracksCue.length; x++) {
                var cueTrackSplitInfo = splitTracksCue[x].split(/\n/);
                var durationSeconds = 0;
                var trackTitle = ""
                var tempStartTimeSeconds;
                var tempEndTimeSeconds;
                //console.log(`cueTrackSplitInfo=`, cueTrackSplitInfo)
                if (cueTrackSplitInfo[0].toUpperCase().includes('AUDIO')) {
                    //look through each option to get title and durationSeconds
                    for (var z = 0; z < cueTrackSplitInfo.length; z++) {
                        let optionStr = cueTrackSplitInfo[z].trim();
                        //title
                        if (optionStr.substr(0, 5) == 'TITLE') {
                            trackTitle = optionStr;
                            trackTitle = trackTitle.substring(7, trackTitle.length - 1)
                        }
                        //get endTime
                        if (optionStr.substr(0, 5) == 'INDEX') {  // && !optionStr.includes('INDEX 01 00:00:00')
                            //get duration (minutes:seconds:milliseconds)
                            var m_s_ms = optionStr.split(' ')[2];
                            var m_s_ms_split = m_s_ms.split(':');
                            //convert duration to seconds
                            tempStartTimeSeconds = (+m_s_ms_split[0] * 60) + (+m_s_ms_split[1]);
                            durationSeconds = 200;

                        }
                    }
                    //x is track number i am on
                    //console.log('tempStartTimeSeconds=', tempStartTimeSeconds, ` (${convertSecondsToTimestamp(tempStartTimeSeconds)})`)
                   
                    var trackData = { 
                        title: trackTitle, 
                        startTime: convertSecondsToTimestamp(tempStartTimeSeconds), 
                        endTime: convertSecondsToTimestamp(0) 
                    }
                    taggerData.push(trackData);
                    //console.log('before taggerData.length', taggerData.length, 'taggerData=', taggerData, '\n')
                    //if we have already pushed a track to taggerData:
                    if(cueFileTrackCount>0){
                        //console.log('set value of taggerData[', cueFileTrackCount-1, '].endTime = taggerData[', cueFileTrackCount, '].startTime')
                        taggerData[cueFileTrackCount-1].endTime = taggerData[cueFileTrackCount].startTime
                    }


                    //startTimeSeconds = endTimeSeconds;
                    cueFileTrackCount+=1;
                    console.log(" . ")
                }

                //let splitTrackInfo = splitTracksCue[x].split('↵')

            }
            //console.log('taggerData.length-1 = ', taggerData.length-1, ', taggerData=', taggerData)
            taggerData[taggerData.length-1].endTime = ""
            resolve(taggerData)
            //resolve([{title: "04 Lifting 2nd Resurrection", startTime: "06:29", endTime: "10:15"},{title: "02 Lifting 2nd Resurrection", startTime: "06:29", endTime: "10:15"}])
        })
    }

    //convert files to tagger data
    async function getFileTaggerData(songs) {
        return new Promise(async function (resolve, reject) {
            var numberOfSongs = songs.length;
            var startTime = "x"
            var endTime = "z"
            var startTimeSeconds = 0
            var endTimeSeconds = 0
            var taggerData = []
            for (i = 0; i < numberOfSongs; i++) {
                console.log(`getFileTaggerData() songs[${i}].type=`, songs[i].type)
                if (!songs[i].type.includes('image')) {
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
            }
            resolve(taggerData)
        })
    }

});

//global vars
let globalTaggerData = null;
let tagsJsonGlobal = null;
let tagsJsonDisplay = null;

async function displayMetadataTags(tags) {
    //reset table slider values
    document.getElementById('releaseArtistsSlider').value = 100;
    document.getElementById('releaseArtistsSliderPercent').innerHTML = `100%`;

    document.getElementById('releaseInfoSlider').value = 100;
    document.getElementById('releaseInfoSliderPercent').innerHTML = `100%`;

    document.getElementById('tracklistSlider').value = 100;
    document.getElementById('tracklistSliderPercent').innerHTML = `100%`;

    document.getElementById('combinationsSlider').value = 100;
    document.getElementById('combinationsSliderPercent').innerHTML = `100%`;

    //store as global variables
    tagsJsonGlobal = tags;
    tagsJsonDisplay = tags;

    //set textbox palceholder to equal nothing
    document.getElementById("tagsBox").placeholder = "";

    //convert tags json object to comma seperated string var
    var tagsAll = getAllTags(tags);

    //get all checkbox and slider values
    var releaseArtistsCheckboxValue = $('.releaseArtistsCheckbox:checked').val();
    var releaseArtistsSliderValue = $('#releaseArtistsSlider').val();

    var releaseInfoCheckboxValue = $('.releaseInfoCheckbox:checked').val();
    var releaseInfoSliderValue = $('#releaseInfoSlider').val();

    var tracklistCheckboxValue = $('.tracklistCheckbox:checked').val();
    var tracklistSliderValue = $('#tracklistSlider').val();

    var combinationsCheckboxValue = $('.combinationsCheckbox:checked').val();
    var combinationsSliderValue = $('#combinationsSlider').val();

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
    let taggerDisplayOption5 = document.getElementById("taggerOption5").value

    let textResult = "Tracklist generated by http://tagger.site: &#13;&#10;"
    //select text box to display data
    for (let [key, value] of Object.entries(input)) {
        let startTime = value.startTime
        let endTime = value.endTime
        let title = value.title
        let trackArtist = value.trackArtist

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

        //determine option5
        if (taggerDisplayOption5 == 'artist') {
            textLine = `${textLine}${trackArtist}`
        } else if (taggerDisplayOption5 == 'blank') {
            textLine = `${textLine}`
        }

        //remove first char if it is blank
        if (textLine[0] == ' ') {
            textLine = textLine.substring(1);
        }

        //`${startTime} - ${endTime} : ${value.title}`  
        textResult = textResult + textLine + "&#13;&#10;"
    }
    document.getElementById("inputBox").innerHTML = textResult
    document.getElementById("tracklistCopy").innerText = `Copy ${textResult.length} Chars to Clipboard`;
}

//take an object with track times and titles and calculate the timestamped tracklist to display
async function getDiscogsTaggerData(tracklistData) {
    return new Promise(async function (resolve, reject) {
        console.log('getDiscogsTaggerData() tracklistData=', tracklistData)
        var taggerData = []
        var startTimeSeconds = 0;
        var endTimeSeconds = 0;
        for (var i = 0; i < tracklistData.length; i++) {
            let isHeadingTrackBool = await isHeadingTrack(tracklistData[i])
            //if track is not a discogs 'heading' track
            if (!isHeadingTrackBool) {
                if (tracklistData[i].duration == "") {
                    taggerData = []
                    var trackData = { title: "Track durations not available on every track for this Discogs URL", startTime: "", endTime: "" }
                    document.getElementById("tracklistCopy").innerText = `Copy 113 Chars to Clipboard`;
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

                    //get track artists
                    let trackArtistsString = ''

                    let trackArtistArr = []
                    if (tracklistData[i].artists) {

                        for (var z = 0; z < tracklistData[i].artists.length; z++) {
                            let trackArtist = removeNumberParenthesesAndComma(tracklistData[i].artists[z].name)
                            trackArtistArr.push(trackArtist) //trackArtistArr
                        }
                        trackArtistsString = `${trackArtistsString} - ${trackArtistArr.join(',')}`

                    } else {
                        trackArtistsString = ` NA`
                    }

                    //add data to object
                    var trackData = {
                        title: tracklistData[i].title,
                        trackArtist: trackArtistsString,
                        startTime: secondsToTimestamp(startTimeSeconds),
                        endTime: secondsToTimestamp(endTimeSeconds)
                    }
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
    try {
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
        document.getElementById('taggerErrDisplay').innerText = ''

    } catch (err) {
        console.log('err getting discogs data = ', err)
        document.getElementById('taggerErrDisplay').innerText = 'Discogs API can only handle so many requests.. please wait a couple seconds and try again.'
    }

}
//make discogs api call
async function getDiscogsData(discogsListingType, discogsListingCode) {
    return new Promise(function (resolve, reject) {
        //make request to colors backend
        $.ajax({
            type: 'POST',
            url: '/discogsAPI',
            data: {
                code: discogsListingCode,
                type: discogsListingType,
            },
        }).then((resp) => {
            console.log('/discogsAPI status = ', resp.status)
            if (resp.status == 400) {
                console.log('err = ', resp)
            }
            resolve(resp)
        }).catch((err) => {
            console.log('err caught')
            reject(err)
        });
    });
}

//curl request to discogs api (rate limit: 3 requests per minute)
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
async function generateDiscogsFileTags(songs) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: "getFileMetadataTags",
            type: 'POST',
            data: {
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
    console.log('tagsJsonGlobal = ', tagsJsonGlobal)
    if (releaseArtistsCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.releaseArtist, (releaseArtistsSliderValue / 100)).tags;
        let calculatedTags = addTags(tagsJsonGlobal.tags.releaseArtist, (releaseArtistsSliderValue / 100))
        let numOfChars = `${calculatedTags.tags.length} chars`
        let currentTagsNum = calculatedTags.length
        let totalTagsNum = tagsJsonGlobal.tags.releaseArtist.length
        //update number of tags out of the total number of tags
        document.getElementById('releaseArtistsTagNum').innerHTML = `${currentTagsNum}/${totalTagsNum} tags`;
        //update number of chars for this tags category
        document.getElementById('releaseArtistsNumber').innerHTML = numOfChars;
    } else {
        document.getElementById('releaseArtistsNumber').innerHTML = "0 chars"
        //document.getElementById('releaseArtistsTagNum').innerHTML = `0/${totalTagsNum} tags`;
        //document.getElementById('releaseArtistsSlider').value = "0"
        //document.getElementById('releaseArtistsSliderPercent').innerText = "0%"
    }

    if (releaseInfoCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.releaseInfo, (releaseInfoSliderValue / 100)).tags;
        let calculatedTags = addTags(tagsJsonGlobal.tags.releaseInfo, (releaseInfoSliderValue / 100))
        let numOfChars = `${calculatedTags.tags.length} chars`
        let currentTagsNum = calculatedTags.length
        let totalTagsNum = tagsJsonGlobal.tags.releaseInfo.length
        //update number of tags out of the total number of tags
        document.getElementById('releaseInfoTagNum').innerHTML = `${currentTagsNum}/${totalTagsNum} tags`;
        //update number of chars for this tags category
        document.getElementById('releaseInfoNumber').innerHTML = numOfChars;
    } else {
        document.getElementById('releaseInfoNumber').innerHTML = "0 chars"
    }

    if (tracklistCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100)).tags;
        let calculatedTags = addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100))
        let numOfChars = `${calculatedTags.tags.length} chars`
        let currentTagsNum = calculatedTags.length
        let totalTagsNum = tagsJsonGlobal.tags.tracklist.length
        //update number of tags out of the total number of tags
        document.getElementById('tracklistTagNum').innerHTML = `${currentTagsNum}/${totalTagsNum} tags`;
        //update number of chars for this tags category
        document.getElementById('tracklistNumber').innerHTML = numOfChars;

        //tags = tags + addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100)).tags;
        //document.getElementById('tracklistNumber').innerHTML = `${addTags(tagsJsonGlobal.tags.tracklist, (tracklistSliderValue / 100)).tags.length} chars`;
    } else {
        document.getElementById('tracklistNumber').innerHTML = "0 chars"
    }

    if (combinationsCheckboxValue == 'on') {
        tags = tags + addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100)).tags;
        let calculatedTags = addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100))
        let numOfChars = `${calculatedTags.tags.length} chars`
        let currentTagsNum = calculatedTags.length
        let totalTagsNum = tagsJsonGlobal.tags.combinations.length
        //update number of tags out of the total number of tags
        document.getElementById('combinationsTagNum').innerHTML = `${currentTagsNum}/${totalTagsNum} tags`;
        //update number of chars for this tags category
        document.getElementById('combinationsNumber').innerHTML = numOfChars;

        //tags = tags + addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100)).tags;
        //document.getElementById('combinationsNumber').innerHTML = `${addTags(tagsJsonGlobal.tags.combinations, (combinationsSliderValue / 100)).tags.length} chars`;
    } else {
        document.getElementById('combinationsNumber').innerHTML = "0 chars"
    }

    document.getElementById("tagsBox").value = tags;
    document.getElementById("tagsCharCount").innerText = `Copy ${tags.length.toString()} Chars to Clipboard`;
}

//remove any numbers inside parentheses like (2) and remove commas from any string
function removeNumberParenthesesAndComma(input) {
    if (input) {

        //if input is object (discogs api only returns objects that are lists)
        if (typeof input == 'object') {
            input = input.join(', ')
        }

        //convert to string
        input = input.toString()
        //remove commas
        input = input.replace(/,/g, '')
        //remove all numbers within parentheses
        var regEx = /\(([\d)]+)\)/;
        var matches = regEx.exec(input);
        if (matches) {
            //remove parentheses number
            var ret = input.replace(matches[0], '')
            //remove last char
            ret = ret.slice(0, -1);
            //console.log('matched return:', ret)
            return ret
        } else {
            //console.log(`nonmatched return|${input}|`)
            return input
        }

    } else {
        return ''
    }

}

//discogstagger: get tags from json
async function getCombinationTags(discogsReleaseData) {
    return new Promise(async function (resolve, reject) {
        let comboTags = []
        //get vars:
        //title
        let title = removeNumberParenthesesAndComma(discogsReleaseData.title)
        //year
        let year = discogsReleaseData.year
        //artist_sort
        let artist = removeNumberParenthesesAndComma(discogsReleaseData.artists_sort)
        //style
        let style = ''
        if (discogsReleaseData.styles) { style = discogsReleaseData.styles[0] }
        //genre
        let genre = ''
        if (discogsReleaseData.genres) { genre = discogsReleaseData.genres[0] }

        //create tags to combine and push:
        comboTags.push(`${title} ${year}`.trim())
        comboTags.push(`${title} ${artist}`.trim())
        comboTags.push(`${artist} ${year}`.trim())
        comboTags.push(`${title} ${style} ${genre}`.trim())

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
            releaseInfoTags.push(removeNumberParenthesesAndComma(discogsReleaseData.year))
        }
        //title
        if (discogsReleaseData.title) {
            releaseInfoTags.push(removeNumberParenthesesAndComma(discogsReleaseData.title))
        }
        //country
        if (discogsReleaseData.country) {
            releaseInfoTags.push(removeNumberParenthesesAndComma(discogsReleaseData.country))
        }
        //genres
        if (discogsReleaseData.genres) {
            releaseInfoTags = releaseInfoTags.concat(removeNumberParenthesesAndComma(discogsReleaseData.genres))
        }
        //styles
        if (discogsReleaseData.styles) {
            releaseInfoTags = releaseInfoTags.concat(removeNumberParenthesesAndComma(discogsReleaseData.styles))
        }
        //formats
        if (discogsReleaseData.formats) {
            for (var g = 0; g < discogsReleaseData.formats.length; g++) {
                //descriptions
                if (discogsReleaseData.formats[g].descriptions) {
                    releaseInfoTags = releaseInfoTags.concat(removeNumberParenthesesAndComma(discogsReleaseData.formats[g].descriptions))
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
                    releaseInfoTags.push(removeNumberParenthesesAndComma(discogsReleaseData.labels[h].name))
                }
            }
        }
        //companies
        if (discogsReleaseData.companies) {
            for (var h = 0; h < discogsReleaseData.companies.length; h++) {
                if (discogsReleaseData.companies[h].name) {
                    releaseInfoTags.push(removeNumberParenthesesAndComma(discogsReleaseData.companies[h].name))
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
            artistTags.push(removeNumberParenthesesAndComma(discogsReleaseData.artists_sort))
        }

        //for each artist in 'artists[]' object
        if (discogsReleaseData.artists) {
            for (var i = 0; i < discogsReleaseData.artists.length; i++) {
                //push artist name
                artistTags.push(removeNumberParenthesesAndComma(discogsReleaseData.artists[i].name))

                //if anv (variation) exists, push that
                if (discogsReleaseData.artists[i].anv) {
                    artistTags.push(removeNumberParenthesesAndComma(discogsReleaseData.artists[i].anv))
                }

                //if artist is not 'Various', get more info
                if (discogsReleaseData.artists[i].name != "Various" && discogsReleaseData.artists[i].resource_url) {

                    //get artist data from discogs API
                    try {
                        let artistData = await getDiscogsData('artist', discogsReleaseData.artists[i].id)
                        //if namevariations exist, add those to artistTags
                        if (artistData.namevariations) {
                            artistTags = artistTags.concat(artistData.namevariations)
                        }

                        //if groups exist
                        if (artistData.groups) {
                            for (var q = 0; q < artistData.groups.length; q++) {
                                //push group name
                                artistTags.push(removeNumberParenthesesAndComma(artistData.groups[q].name))
                                //if anv exists, push that
                                if (artistData.groups[q].anv) {
                                    artistTags.push(removeNumberParenthesesAndComma(artistData.groups[q].anv))
                                }
                            }
                        }

                        //if members exist
                        if (artistData.members) {
                            //for each member
                            for (var z = 0; z < artistData.members.length; z++) {
                                //push name
                                artistTags.push(removeNumberParenthesesAndComma(artistData.members[z].name))

                                //push anv if it exists
                                if (artistData.members[z].anv) {
                                    artistTags.push(removeNumberParenthesesAndComma(artistData.members[z].anv))
                                }


                                //get more info on that member if possible
                                if (artistData.members[z].resource_url) {
                                    let memberArtistData = await discogsAPIQuery(artistData.members[z].resource_url)
                                    //if namevariations exist, add that to artistTags
                                    if (memberArtistData.namevariations) {
                                        artistTags = artistTags.concat(memberArtistData.namevariations)
                                    }
                                    //if groups exist, add that 
                                    if (memberArtistData.groups) {
                                        //for each group
                                        for (var x = 0; x < memberArtistData.groups.length; x++) {
                                            //push group name
                                            artistTags.push(removeNumberParenthesesAndComma(memberArtistData.groups[x].name))

                                        }
                                    }
                                    //if aliases exist
                                    if (memberArtistData.aliases) {
                                        for (var y = 0; y < memberArtistData.aliases.length; y++) {
                                            artistTags.push(removeNumberParenthesesAndComma(memberArtistData.aliases[y].name))
                                            if (memberArtistData.aliases[y].anv) {
                                                artistTags.push(removeNumberParenthesesAndComma(memberArtistData.aliases[y].anv))
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        //if aliases exist
                        if (artistData.aliases) {
                            for (var y = 0; y < artistData.aliases.length; y++) {
                                artistTags.push(removeNumberParenthesesAndComma(artistData.aliases[y].name))
                                removeNumberParenthesesAndComma(artistData.aliases[y].name)
                                if (artistData.aliases[y].anv) {
                                    artistTags.push(removeNumberParenthesesAndComma(artistData.aliases[y].anv))
                                }
                            }
                        }
                    } catch (err) {
                        console.log('err getting artist data CAUGHT')
                    }


                }

            }
        }
        /*
        //if extraartists[] exists
        if (discogsReleaseData.extraartists) {
            //for each artist in extraartists
            for (var i = 0; i < discogsReleaseData.extraartists.length; i++) {
                //push name
                artistTags.push(removeNumberParenthesesAndComma(discogsReleaseData.extraartists[i].name))

                //if anv exists, push that too
                if (discogsReleaseData.extraartists[i].anv) {
                    artistTags.push(removeNumberParenthesesAndComma(discogsReleaseData.extraartists[i].anv))
                }

                
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
                            artistTags.push(removeNumberParenthesesAndComma(extraArtistData.groups[q].name))
                            //if anv exists, push that
                            if(extraArtistData.groups[q].anv){
                                extraArtistData.push(removeNumberParenthesesAndComma(extraArtistData.groups[q].anv))
                            }
                        }
                    }

                    //if members exist
                    if(extraArtistData.members){
                        //for each member
                        for(var z = 0; z < extraArtistData.members.length; z++){
                            //push name
                            artistTags.push(removeNumberParenthesesAndComma(extraArtistData.members[z].name))

                            //push anv if it exists
                            if(extraArtistData.members[z].anv){
                                artistTags.push(removeNumberParenthesesAndComma(extraArtistData.members[z].anv))
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
                                        artistTags.push(removeNumberParenthesesAndComma(memberArtistData.groups[x].name))
                                        
                                    }
                                    
                                }
                            }
                        }
                    }

                }
            }
        }
        */

        //get artists / extrartists from tracklist
        if (discogsReleaseData.tracklist) {
            for (var i = 0; i < discogsReleaseData.tracklist; i++) {
                //if track in tracklist has extraartists data
                if (discogsReleaseData.tracklist[i].extraartists) {
                    for (var x = 0; x < discogsReleaseData.tracklist[i].extraartists; x++) {
                        artistTags.push(removeNumberParenthesesAndComma(discogsReleaseData.tracklist[i].extraartists[x].name))
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

    var numberOfTagsavailable = tags.length;
    var numberOfTagsToDisplay = numberOfTagsavailable * percentToInclude;
    numberOfTagsToDisplay = ~~numberOfTagsToDisplay;
    for (var i = 0; i < numberOfTagsToDisplay; i++) {
        tempTags = tempTags + tags[i] + ","
    }
    return { tags: tempTags, length: numberOfTagsToDisplay, numberOfTagsAvailiable: numberOfTagsavailable };
}

function prepUpdateTagsBox() {
    console.log('prepUpdateTagsBox()')
    var releaseArtistsCheckboxValue = $('.releaseArtistsCheckbox:checked').val();
    var releaseArtistsSliderValue = $('#releaseArtistsSlider').val();

    var releaseInfoCheckboxValue = $('.releaseInfoCheckbox:checked').val();
    var releaseInfoSliderValue = $('#releaseInfoSlider').val();

    var tracklistCheckboxValue = $('.tracklistCheckbox:checked').val();
    var tracklistSliderValue = $('#tracklistSlider').val();

    var combinationsCheckboxValue = $('.combinationsCheckbox:checked').val();
    var combinationsSliderValue = $('#combinationsSlider').val();

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
        } catch {
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
