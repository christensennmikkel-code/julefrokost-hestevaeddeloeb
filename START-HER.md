# Hestevæddeløb – Autopilot + Sabotage

Online multiplayer til 1-10 ryttere. Kræver kun GitHub og Render, hvis du vil have det på nettet.

## Nye regler

- Værten trykker START én gang.
- Hvert spørgsmål varer op til 18 sekunder; når alle har svaret, afsluttes spørgsmålet straks.
- Svaret vises i 3,5 sekunder, og næste spørgsmål starter automatisk.
- Rigtigt svar = 8-12 meter, afhængigt af svartid. Forkert eller manglende svar nulstiller din serie.
- Efter **tre rigtige i træk** får rytteren en sabotage: vælg en anden hest på telefonen inden for 12 sekunder.
- En saboteret hest rykkes **én placering ned på ranglisten** ved at få meter nok trukket fra til at placere den lige bag næste hest. Kan ikke flyttes længere ned end nul meter/sidstepladsen.
- Sabotage optjenes igen efter 6, 9, 12 osv. rigtige i træk.
- Løbet slutter automatisk, når nogen når 120 meter, eller alle 16 opgaver er brugt.

## Opdater dit eksisterende GitHub-repository

1. Pak ZIP-filen ud i Windows.
2. Åbn det eksisterende GitHub-repository `julefrokost-hestevaeddeloeb`.
3. Vælg **Add file > Upload files**.
4. Træk **indholdet** af den udpakkede `hestevaeddeloeb-auto`-mappe ind (ikke selve mappen eller ZIP-filen).
5. Sørg for at `server.js`, `package.json`, `render.yaml`, `START-HER.md` ligger direkte i roden, og at `index.html`, `host.html`, `app.js`, `style.css` ligger under `public/`.
6. Bekræft ændringerne med **Commit changes**. Hvis GitHub ikke tillader overskrivning i uploaderen, kan du åbne hver eksisterende fil, trykke blyanten og indsætte indholdet fra den nye fil i editoren. De ændrede kodefiler er `server.js`, `public/app.js`, `public/style.css`.
7. Render skal automatisk genudgive ændringerne – se **Deploys**, og vent på **Live**.

## Vigtigt

Spillet holder en igangværende runde i serverens hukommelse. Ved servergenstart vil rummet forsvinde. Gratis Render kan gå i dvale. Test inden julefrokosten.
