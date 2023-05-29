var fs = require('fs');

let request_url = "https://escalade.online/ws/app/resultatJson/"
page_url = "https://escalade.online/resultats.html?id="
function getJson(url) {
    var promise = Promise.resolve();
    promise = promise.then(function(data) {
        fetch(url).then(function(response) {
            // Test if the body is empty
            if (response.status === 204) {
                return null;
            }
            return response.json();
        }).then(function(data) {
            return data;
        }).catch(function(error) {
            console.log(error);
            return null;
        });
    });
    return promise;
}

function requestComps(min, max) {
    var promise = Promise.resolve();
    promise = promise.then(function(data) {
        for (let i = min; i <= max; i++) {
            getJson(request_url + i).then(function(data) {
                if (data != null) {

                    console.log("Compétition : '" + data['nomCompetition'] + "' à l'url : " + page_url + i);
                    try {
                        if (!fs.existsSync("data")) {
                            fs.mkdirSync("data");
                        }
                    } catch (err) {
                        console.error(err);
                    }
                    fs.writeFile('data/' + i + '.json', JSON.stringify(data), function(err) {
                        if (err) {
                            console.error(err + "pendant l'écriture du fichier " + i + ".json");
                        }
                    }, function() {
                        console.log("Fichier " + i + ".json créé");
                    });
                }
            }).catch(function(error) {
                console.error(error + " sur la compétition : " + i);
            });
        }
    });
    return promise;
}

requestComps(11600, 11700).then(function(data) {
    files = fs.readdirSync('');
    console.log(files);
}).catch(function(error) {
    console.error(error);
});


// Path: index.html