# Cyber-quizzer

Små quizzer til opsamling i it-sikkerhed. Ét spørgsmål ad gangen, med forklaring efter hvert svar.

**Åbn dem her:** https://andracs.github.io/cyber-quizzer/

## Quizzer

| Quiz | Fag | Spørgsmål |
|------|-----|-----------|
| [Beskyttelse af it-systemer](https://andracs.github.io/cyber-quizzer/systemsikkerhed/) | Systemsikkerhed | 23 |

## Brug

- **Piletaster** bladrer frem og tilbage. Det virker også med en presenter-klikker.
- **A til D** vælger et svar, **S** og **F** svarer sandt eller falsk, og **Enter** går videre.
- Resultatsiden viser, hvad der var rigtigt, forkert og ikke besvaret. Klik på et spørgsmål for at se det igen.

Hver quiz er én HTML-fil uden eksterne afhængigheder. Den gemmer intet og sender intet nogen steder hen, så den kan også downloades og bruges offline.

## Ret eller tilføj en quiz

Indholdet ligger i `src/quizzes/`. Hver JSON-fil bliver til sin egen quiz og kommer automatisk på forsiden.

```bash
node src/build.js
git add -A && git commit -m "Opdater quiz" && git push
```

Der er fire spørgsmålstyper:

- `mc` har 2 til 4 svar i `svar`, og `rigtigt` er index for det rigtige (0 = A).
- `sandtfalsk` har `rigtigt` sat til `true` eller `false`.
- `raekkefoelge` skriver `elementer` i rigtig rækkefølge. De bliver blandet automatisk.
- `estimat` har `min`, `max`, `trin`, `start` og `enhed`. Et gæt tæller som rigtigt, hvis det er højst 15 % fra `rigtigt`.

`*ord i stjerner*` vises i kursiv.

## Licenser

Skrifttypen Selawik er Microsofts open source-font under SIL Open Font License (`src/fonts/OFL-Selawik.txt`).
