$(document).ready(function () {
    console.log('popularify.js loaded')
})

async function popularifySubmit(input){
    if(input==""){
        input='spotify:artist:5fAix5NwfNgHQqYRrHIPxo'
    }
    console.log('popularifySubmit() input=', input)
    let popularifyData = await getPopularifyData(input);
    console.log('popularifySubmit() popularifyData=', popularifyData)
}

async function getPopularifyData(input){
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: "popularifyRequest",
            type: 'POST',
            data:{
                input: input,
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

