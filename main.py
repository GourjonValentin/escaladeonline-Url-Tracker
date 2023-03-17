import requests
from tqdm import tqdm


RANGE_MIN = 11500
RANGE_MAX = 11600
BASE_URL = "https://escalade.online/ws/app/resultatJson/"

if __name__ == "__main__":

    comps = {}
    for i in tqdm(range(RANGE_MIN, RANGE_MAX)):
        url = BASE_URL + str(i)
        r = requests.get(url)
        if r.text != "":
            data = r.json()
            comps[i] = data
            print(f"Found competition: {data['nomCompetition']} at url https://escalade.online/resultat.html?id={i}")

    print("Requests done.")

    print(f"Found {len(list(comps))} competitions:")
    for i in comps:
        print(f"{comps[i]['nomCompetition']} : https://escalade.online/resultat.html?id={i}")


