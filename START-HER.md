# 🏇 Julefrokost Hestevæddeløb — Online multiplayer

Denne version er et **nyt og selvstændigt spil**. Dit eksisterende Julefrokost Royale-spil bliver ikke ændret.

## Sådan får du spillet online (Windows, uden installation)

1. Udpak ZIP-filen i Windows (højreklik → **Udpak alle**).
2. Gå til https://github.com/new og opret et **nyt** repository, fx `julefrokost-hestevaeddeloeb`.
3. Klik på **uploading an existing file** i det tomme repository. Træk alle disse 5 elementer ind: `package.json`, `render.yaml`, `server.js`, `START-HER.md` og hele `public`-mappen. Vælg **Commit changes**.
4. Gå til https://dashboard.render.com/ og vælg **New → Web Service**. Vælg dit **nye** GitHub-repository.
5. Vælg **Language: Node**, **Branch: main**, **Root Directory: tom**, **Build Command: `npm install`**, **Start Command: `npm start`**, **Compute: Free**. Lad **Environment Variables** være tomme.
6. Klik **Deploy Web Service**. Når Render viser **Live**, klik på den URL du får.
7. På computeren / TV'et: Åbn `https://DIN-URL.onrender.com/host`. Klik **Opret et nyt væddeløb**.
8. Deltagerne åbner spillerlinket fra værtsskærmen på deres telefoner, skriver navn og vælger **Deltag**. Alternativt kan de scanne QR-koden.
9. Klik **Start løbet** på værtsskærmen. Hvert rigtigt svar flytter hesten 8–12 meter, afhængigt af hurtighed. En runde varer højst 18 sekunder. Når alle har svaret, afsløres svaret automatisk.
10. Klik **Næste opgave** efter afsløringen. Den første hest over 120 meter vinder; ellers vinder hesten med flest meter efter 16 opgaver.

### Test alene
Du kan joine fra din egen mobil. Flere inkognitovinduer kan bruges som ekstra spillere. Løbet kan startes med én spiller, hvis du kun tester.

### Bemærk
- Serveren kører på Renders gratis server. Den kan gå i dvale efter inaktivitet, og en genstart nulstiller igangværende løb. Åbn og test spillet før festen.
- Sørg for, at du bruger **et nyt GitHub-repository og en ny Render-webservice**. Så beholder du det gamle Julefrokost Royale.
- Der er højst 10 ryttere pr. løb. Navne, rumkode og spillerlogin ligger midlertidigt i serverens hukommelse.
- Den lille QR-kode er lavet via en ekstern tjeneste. Linket fungerer, selv hvis QR-koden ikke indlæses.
