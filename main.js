async function getResults(min, max){
    // Get data from server
    return await fetch("/resultats?min=" + min + "&max=" + max).then((res) => {
        return res.json();
    });
}


async function search(id = null) {
    // Init variables
    const button = document.getElementById("search");
    button.disabled = true;
    const div = document.getElementById("result");
    div.innerHTML = "Recherche en cours...";
    let range_min, range_max;
    if (id != null) {
        range_min = id;
        range_max = id;
    } else {
        // Get input value in html form
        range_min = document.getElementById("min").value;
        range_max = document.getElementById("max").value;
    }
    if (range_min === "" || range_max === "") {
        div.innerHTML = "Veuillez remplir les deux champs";
        button.disabled = false;
        return;
    }
    if (range_min > range_max) {
        div.innerHTML = "Veuillez entrer un intervalle valide";
        button.disabled = false;
        return;
    }
    if (range_min < 0 || range_max < 0) {
        div.innerHTML = "Veuillez entrer un intervalle valide";
        button.disabled = false;
        return;
    }
    if (range_min > 100000 || range_max > 100000) {
        div.innerHTML = "Veuillez entrer un intervalle valide";
        button.disabled = false;
        return;
    }
    if (range_max - range_min > 100) {
        div.innerHTML = "L'intervalle ne doit pas dépasser 100";
        button.disabled = false;
        return;
    }
    const data = await getResults(range_min, range_max);
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        console.log("Aucun résultat trouvé")
        div.innerHTML = "Aucun résultat trouvé";
    } else {
        for (let c in data) {
            div.innerHTML = "<h2>Resultats :</h2><br/>";
            const compet = data[c];
            div.innerHTML += "<a href='/resultat/" + c + "'>" + compet["nomCompetition"] + "</a><br/>";

        }
    }
    button.disabled = false;
}

