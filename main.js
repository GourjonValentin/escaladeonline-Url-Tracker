async function getResults(min, max){
    // Get data from server
    return await fetch("/resultats?min=" + min + "&max=" + max).then((res) => {
        return res.json();
    });
}


async function search(id = null) {
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
    const div = document.getElementById("result");
    const data = await getResults(range_min, range_max);
    div.innerHTML = "";
    for (let c in data) {
        const compet = data[c];
        div.innerHTML += "<a href='/resultat/" + c + "'>" + compet["nomCompetition"] + "</a><br/>";
    }
}

