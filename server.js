const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;
var nb_request = 0;

app.use(bodyParser.json());

function centerString(str, size) {
    let str_size = str.length;
    let str_space = size - str_size;
    let str_space_left = Math.floor(str_space / 2);
    let str_space_right = str_space - str_space_left;
    return " ".repeat(str_space_left) + str + " ".repeat(str_space_right);
}

function log(type, msg, ip) {
    let options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    };
    let date = new Date().toLocaleDateString("fr-FR", options);
    nb_request = centerString(`${nb_request}`, 6); // Center request number on 6 characters
    // Center IP on 22 characters
    if (ip != null) {
        ip = centerString(ip, 22)
    } else {
        ip = " ".repeat(22);
    }
    type = centerString(type, 6)
    console.log("[" + nb_request + "] [" + date + "] [" + ip + "] ["+ type + "] : " + msg);
}

async function getJson(url){
    return new Promise((resolve) => {
        https.get(url, (resp) => {
            // Get response and return json data
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                if (data !== "") {
                    log("GET", url)
                    try {
                        resolve(JSON.parse(data));
                    }
                      catch (err) {
                        log("ERROR", "Error while parsing json data of " + url)
                        console.log(data);
                        resolve(null);
                      }

                } else {
                    resolve(null);
                }
            });
        });
    });
}

async function requestComp(id){
    const data = await getJson("https://mycompet.ffme.fr/ws/app/resultatJson/" + id);
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
    if (data == null) {
        return "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><meta http-equiv='refresh' content='30'><title id='title'>Erreur</title><body><h1>Erreur</h1><br/><h2>La compétition n'existe pas</h2><br/><h3><a href='../'>Revenir à la page de recherche</a></h3><br/></body></html>";
    }

    // Head of html file
    const style = "<style>table, th, td {border: 1px solid black; border-collapse: collapse; text-align: center;}</style>"
    let html = "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><meta http-equiv='refresh' content='30'><title>" + data["nomCompetition"] + "</title><body>" + style + "<h1>" + data["nomCompetition"] + "</h1><br/>";
    html += "<h3><a href='../'>Revenir à la page de recherche</a></h3><br/>"
    html += "<h2>Lieu : " + data["lieu"] + "</h2><br/>";
    html += "<h3><a href='" + "https://mycompet.ffme.fr/resultat.html?id=" + id + "'>Lien vers les résultats officiels de la compétition</a></h3><br/>";

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

function backupResult(data, id, full = false) {
    if (full) {
        if (!fs.existsSync("backup/")){
            fs.mkdirSync("backup/");
        }
        // Backup data with date ant time in name
        const date = new Date();
        const name = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDay() + "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds();
        fs.writeFileSync("backup/" + id + "_" + name + ".json", JSON.stringify(data), (err) => {
            if (err) {
                log("ERROR", "Error while writing backup file", err);
            }
        });
    }
    else {
        if (!fs.existsSync("data/")){
            fs.mkdirSync("data/");
        }
        fs.writeFileSync("data/" + id + ".json", JSON.stringify(data), (err) => {
            if (err) {
                log("ERROR", "Error while writing data file", err);
            }
        });
    }
}

app.get('/', (req, res) => {
    nb_request++;
    log("LOG", "Request to /", req.ip);
    res.sendFile(__dirname + '/find.html');
});

app.get("/main.js", (req, res) => {
    res.sendFile(__dirname + "/main.js");
});

app.get('/resultat/:id', async (req, res) => {
    nb_request++;
    const id = req.params.id;
    const data = await requestComp(id);
    const html = extractData(data, id);
    log("LOG", "Request to /resultat/" + id, req.ip);
    res.send(html);
});
app.get('/resultats', async (req, res) => {
    nb_request++;
    const min = req.query.min;
    const max = req.query.max;
    const data = await requestComps(min, max);
    log("LOG", "Request to /resultats from " + min + " to " + max , req.ip);
    res.send(data);
});

app.get('/backup/:id', async (req, res) => {
    nb_request++;
    const id = req.params.id;
    const data = await requestComp(id);
    backupResult(data, id, true);
    log("LOG", "Backup of " + id, req.ip);
    res.send("Backup done");
});

app.get('/backup', async (req, res) => {
    nb_request++;
    const min = req.query.min;
    const max = req.query.max;
    const data = await requestComps(min, max);
    for (let id in data) {
        backupResult(data[id], id, true);
    }
    log("LOG", "Backup from " + min + " to " + max, req.ip);
    res.send("Backup of all done");
});

/* Gestion de la délétion des backups, on pause
app.get('/manageBackups', async (req, res) => {

});*/

app.listen(port, () => console.log(`Example app listening on port ${port}!`));