import requests
from tqdm import tqdm
import json
import os

BASE_URL = "https://escalade.online/ws/app/resultatJson/"

def getRouteFromId(id, groupe):
    for route in groupe['etapes']:
        if route['id'] == id:
            return route

def removeSlash(str):
    return str.replace("/", "-")

def extractData(id, logs = False):
    with open(f"data/{id}.json") as f:
        data = json.load(f)

    print(data['nomCompetition'])
    style = "<style>table, th, td {border: 1px solid black; border-collapse: collapse; text-align: center;}</style>"
    strTable = f"<!DOCTYPE html><head><meta http-equiv=\"refresh\" content=\"5\"><body><html>{style}<h1>{data['nomCompetition']}</h1><br/>"
    strTable += f"<h2>Lieu : {data['lieu']}</h2><br/>"
    strTable += f"<h3><a href='https://escalade.online/resultat.html?id={id}'>Lien vers les résultats officiels</a></h3><br/>"


    for groupe in data['groupes']:
        if groupe['resultats'] != []: # Ne prends pas les regroupements où il n'y a pas de classement

            groupeHeader = f"{groupe['categorie']} {groupe['sexe']}" # Header du regroupement

            strSubTable = f"<h2>{groupeHeader}</h2><br/>"

            if logs:
                print("\n")

                print(groupeHeader)

            strSubTable += "<table><tr><th>Classement</th><th>Competiteur</th><th>Club</th>"

            for route in groupe['etapes']:
                strSubTable += f"<th>Voie {route['nom']}  <br/>{route['couleur']}</th>"

            strSubTable += "</tr>"

            for competiteur in groupe['resultats']:
                if logs:
                    print(f"{competiteur['nom']} {competiteur['prenom']}")  # Header du compétiteur

                strRow = f"<tr><td>{competiteur['classement']}</td><td>{competiteur['nom']} {competiteur['prenom']}</td><td>{competiteur['nomClub']}</td>"

                # Résultats du compétiteur
                for etape in competiteur['etapes']:
                    id = etape['idEtape']
                    route = getRouteFromId(id, groupe)

                    if logs:
                        print(f"Voie {route['nom']} {route['couleur']} : {etape['resultat']}")

                    strRow += f"<td>{etape['resultat']}</td>"

                # Classement du compétiteur
                if logs:
                    print(f"Classement : {competiteur['classement']}")
                    print()

                strRow += f"</tr>"
                strSubTable += strRow



            strSubTable += "</table><br/>"
            strTable += strSubTable

    strTable += "</body></html>"
    file = f"html/{removeSlash(data['nomCompetition'])}.html"
    with open(file, 'w') as f:
        f.write(strTable)

def requestComps(min, max):
    comps = {}
    for i in tqdm(range(min, max)):
        url = BASE_URL + str(i)
        r = requests.get(url)
        if r.text != "":
            data = r.json()
            comps[i] = data
            print(f"\nFound competition: {data['nomCompetition']} at url https://escalade.online/resultat.html?id={i}")

    print("Requests done.")
    return comps

def main(min = None, max = None):
    if (min != None) and (max != None):
        range_min = min
        range_max = max
    else:
        range_min = int(input("Borne inférieure (environ 11550 en avril 2023) : "))
        range_max = int(input("Borne supérieure: (environ 11600 en avril 2023) : "))

    comps = requestComps(range_min, range_max)

    print(f"Found {len(list(comps))} competitions:")

    try:
        os.mkdir("data")
    except:
        pass

    for i in comps:
        print(f"{comps[i]['nomCompetition']} : https://escalade.online/resultat.html?id={i}")
        with open(f"data/{i}.json", 'w') as j:
            json.dump(comps[i], j)

    if min!= None and max != None:
        choice = 1
    else :
        print("Voulez-vous extraire les données ?")
        print("1. Oui")
        print("2. Non")
        choice = int(input("Choix: "))
    if choice == 1:

        data_files = os.listdir("data/")
        try:
            os.mkdir("html")
        except:
            pass
        if main != None and max != None:
            extractData(min, False)
        else:
            for id in data_files:
                try:
                    extractData(id.replace(".json", ""), False)
                except:
                    print(f"Erreur lors de l'extraction de {id}")
                    continue
        print()
        print("Les données ont été extraites dans le dossier html.")
        print()

    else:
        print("Fin du programme.")

    if min != None and max != None:
        pass
    else:
        input("Press enter to exit.")

if __name__ == "__main__":
    main()