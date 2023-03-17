import requests
from tqdm import tqdm


if __name__ == "__main__":

    base_url = "https://escalade.online/ws/app/resultatJson/"
    comps = {}
    for i in tqdm(range(11000, 12000)):
        url = base_url + str(i)
        r = requests.get(url)
        if r.text != "":
            data = r.json()
            comps[i] = data

    for i in comps:
        print(f"{comps[i]['nomCompetition']} : bhttps://escalade.online/resultat.html?id={i}")


