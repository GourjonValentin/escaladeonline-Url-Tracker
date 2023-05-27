import main
import time

if __name__ == "__main__":
    id = int(input("ID de la compétition: "))
    while True:
        main.main(id, id+1)
        time.sleep(5)
