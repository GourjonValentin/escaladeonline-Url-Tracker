const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/find.html');
});

app.get("/main.js", (req, res) => {
    res.sendFile(__dirname + "/main.js");
});


async function getJson(url){
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            // Get response and return json data
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                if (data !== "") {
                    resolve(JSON.parse(data));
                } else {
                    resolve(null);
                }
            });
        });
    });
}

async function requestComp(id){
    const data = await getJson("https://escalade.online/ws/app/resultatJson/" + id);
    if (data != null) {
        backupResult(data, id);
    }
    return data;
}
async function requestComps(min, max){
    let data = {};
    for (let i = min; i <= max; i++) {
        const comp = await requestComp(i);
        if (comp != null) {
            data[i] = comp;
        }
    }
    return data;
}

function getRouteFromId(id, group) {
    for (let route of group["etapes"]) {
        if (route["id"] === id) {
            return route;
        }
    }
}

function extractData(data, id,  logs = false) {

    // Head of html file
    const style = "<style>table, th, td {border: 1px solid black; border-collapse: collapse; text-align: center;}</style>"
    let html = "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><meta http-equiv='refresh' content='30'><title>" + data["nomCompetition"] + "</title><body>" + style + "<h1>" + data["nomCompetition"] + "</h1><br/>";
    html += "<h2>Lieu : " + data["lieu"] + "</h2><br/>";
    html += "<h3><a href='" + "https://escalade.online/resultat.html?id=" + id + "'>Lien vers les résultats officiels de la compétition</a></h3><br/>";

    // Get all groupes
    for (let group of data["groupes"]) {
        if (group['resultats'] != null) { // Ne prends pas en compte les groupes sans résultats

            // Name of the table
            let groupeHeader = group["categorie"] + " " + group["sexe"];

            let table = "<h2>" + groupeHeader + "</h2><br/>"

            if (logs) {
                console.log(groupeHeader);
            }
            // Head of the table
            table += "<table><tr><th>Classement</th><th>Competiteur</th><th>Club</th>"

            // Get all routes
            for (let route of group["etapes"]) {
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
                let line = "<tr><td>" + competitor["classement"] + "</td><td>" + competitor["nom"] + " " + competitor["prenom"] + "</td><td>" + competitor["nomClub"] + "</td>";

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
    return html;
}

function backupResult(data, id) {
    fs.writeFile("data/" + id + ".json", JSON.stringify(data), (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

app.get('/resultat/:id', async (req, res) => {
    const id = req.params.id;
    const data = await requestComp(id);
    const html = extractData(data, id);
    res.send(html);
});
app.get('/resultats', async (req, res) => {
    const min = req.query.min;
    const max = req.query.max;
    const data = await requestComps(min, max);
    res.send(data);
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));