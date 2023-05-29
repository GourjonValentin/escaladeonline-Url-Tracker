var fs = require('fs');

let request_url = "https://escalade.online/ws/app/resultatJson/"
let page_url = "https://escalade.online/resultats.html?id="

function getJson(url) {
    return fetch(url)
        .then((response) => {if (response.status === 204) {return null;} return response.json();})
        .then((json) => {console.log("Request to competition " + url.slice(-5) + " successfully finished"); return json})
}

function getRouteFromId(id, group) {
    for (let route of group["etapes"]) {
        if (route["id"] == id) {
            return route;
        }
    }
}

function removeSlash(string) {
    return string.replace("/", "-");
}

function extractData(id, logs = false) {
    // Get json file
    let data = JSON.parse(fs.readFileSync('data/' + id + '.json', 'utf8'));

    // Head of html file
    const style = "<style>table, th, td {border: 1px solid black; border-collapse: collapse; text-align: center;}</style>"
    let html = "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><meta http-equiv='refresh' content='5'><title>" + data["nomCompetition"] + "</title><body>" + style + "<h1>" + data["nomCompetition"] + "</h1><br/>";
    html += "<h2>Lieu : " + data["lieu"] + "</h2><br/>";
    html += "<h3><a href='" + page_url + id + "'>Lien vers les résultats officiels de la compétition</a></h3><br/>";

    // Get all groupes
    for (let group of data["groupes"]) {
        if (group['resultats'] != null) { // Ne prends pas en compte les groupes sans résultats

            // Name of the table
            let groupeHeader = group["categorie"] + group["sexe"];

            let table =  "<h2>" + groupeHeader + "</h2><br/>"

            if (logs) {
                console.log(groupeHeader);
            }
            // Head of the table
            table += "<table><tr><th>Classement</th><th>Competiteur</th><th>Club</th>"

            // Get all routes
            for (let route of group["etapes"]){
                table += "<th>Voie " + route["nom"] + "</th>"
            }

            // End of head
            table += "</tr>"

            // Get all results
            for (let competitor of group["resultats"]) {
                if (logs) {
                    console.log(competitor["classement"] + " " + competitor["nom"] + " " + competitor["club"]);
                }

                // Start of line
                let line = "<tr><td>" + competitor["classement"] + "</td><td>" + competitor["nom"] + competitor["prenom"] +"</td><td>" + competitor["club"] + "</td>";

                for (let etape of competitor["etapes"]) {
                    let id = etape["idEtape"];
                    let route = getRouteFromId(id, group);

                    if (logs) {
                        console.log("Voie " + route["nom"] + " : " + etape["classement"]);
                    }

                    // Add result to line
                    line += "<td>" + etape["resultat"] + "</td>";

                }

                if (logs) {
                    console.log("Classement : " + competitor["classement"]);
                }
                // End of line
                line += "</tr>";

                // Add line to table
                table += line;
            }
            // End of table

            table += "</table><br/>";

            // Add table to html
            html += table;
        }
    }
    // End of html file
    html += "</body></html>";

    // Create html folder if not exists
    try {
        if (!fs.existsSync("html")) {
            fs.mkdirSync("html");
        }
    } catch (err) {
        console.error(err);
    }

    // Write html file to disk
    let file_name = "html/" + id + ".html";
    fs.writeFileSync(file_name, html);
}

function main(id = null) {
    // Init variables
    let range_min, range_max;
    if (id != null) {
        range_min = id;
        range_max = id;
    } else {
        // Get input value in html form
        range_min = document.getElementById("min").value;
        range_max = document.getElementById("max").value;
    }

    // Create data folder if not exists
    try {
        if (!fs.existsSync("data")) {
            fs.mkdirSync("data");
        }
    } catch (err) {
        console.error(err);
    }

    // Request all competitions in range
    for (let i = range_min; i <= range_max; i++) {
        getJson(request_url + i).then((data) => {
            if (data != null) {
                console.log("Compétition : '" + data['nomCompetition'] + "' à l'url : " + page_url + i);
                fs.writeFileSync('data/' + i + '.json', JSON.stringify(data));

            // Create html file
            extractData(i);
            }
        });
    }
}

main(11615);