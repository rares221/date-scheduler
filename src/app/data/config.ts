import { InjectionToken } from '@angular/core';
import { AppConfig } from './config.types';

/* config.ts — tot ce se personalizează în pagină.
   Fișierul e public (GitHub Pages), deci nu pune aici nimic secret.
   Cheia Web3Forms poate fi publică: trimite emailuri doar către adresa ta. */

/* ============================================================
   CONFIG — aici personalizezi totul
   ============================================================ */
export const CONFIG: AppConfig = {
  to: "Iubito",
  from: "R.",
  organizerEmail: "",                   // emailul tău (opțional)
  title: "Ieși cu mine?",
  subtitle: "Sheeba și cu mine avem o întrebare…",
  durationMinutes: 150,
  timezone: "Europe/Bucharest",

  // Melodii YouTube: id = partea de după "watch?v=", start = secunda de pornire
  //  intro → merge pe tot scroll-ul;  yes → pornește la „Da";  no → pornește la primul „Nu"
  //  dacă id e gol, muzica se oprește (cu fade) în momentul ăla
  songs: {
    // vertical:true = clip 9:16 (umple ecranul telefonului ca fundal); fără = clip orizontal 16:9
    intro: { id:"vFApMni5qIA", start:0, vertical:true },  // Little Mix – Sweet Melody (Official Vertical Video)
    // question → pornește când ajunge la cardul „Iubito, ieși cu mine?" (la scroll, doar înainte, niciodată înapoi).
    //  Pune aici id-ul YouTube (partea de după "watch?v="); cât timp e gol, continuă melodia de dinainte.
    question: { id:"", start:0 },
    yes:   { id:"1WpoKRnoPRU", start:0 },                   // Little Mix – Love Me Like You (Official Video)
    no:    { id:"", start:0 }
  },

  photos: { sheeba: "assets/sheeba.jpg", judging: "assets/sheeba-judging.jpg" },

  story: [
    { title:"Bună, iubito",  text:"Am făcut ceva doar pentru tine. Dă scroll încet…", hint:true },
    { photo:"sheeba", title:"Am vorbit cu Sheeba.", text:"A zis că e de acord. Cu condiția să-i aducem ceva bun la întoarcere." },
    { title:"Și ți-am pus melodia ta.", text:"Dă-i volum. Merită." },
    { title:"Eu am scris destule singur.", text:"De data asta tu alegi cuvintele." },
    { title:"Și m-am gândit…", text:"…că e cam timpul pentru o seară doar a noastră." }
  ],

  // la fiecare „nu" apare Sheeba cu privirea ei și unul din mesajele astea (pe rând)
  noMessages: [
    "Sheeba te privește.", "Sheeba nu e impresionată.", "Sheeba își notează asta.",
    "Sheeba e dezamăgită, dar nu surprinsă."
  ],
  // după „nu", ea trebuie să scrie un motiv bun (ți se trimite pe email, dacă e setată cheia de mai jos)
  noReason: {
    prompt: "Bine. Dar Sheeba vrea un motiv bun.",
    placeholder: "un motiv foarte bun…",
    sent: "Sheeba a primit motivul. Îl analizează. Butonul „Da” e tot aici."
  },
  // Email când ea confirmă data sau trimite un motiv pentru „nu" (gratuit, prin web3forms.com):
  //  intri pe web3forms.com, pui emailul tău, primești un „access key" și îl pui aici.
  //  Emailurile vin doar la tine (adresa legată de cheie). Gol = nu se trimite nimic.
  notify: { web3formsKey: "9ca0a2ec-81a3-4ec4-967f-e8fedf11bbe6" },
  // verse: ultimele două versuri ale strofei, pentru fiecare activitate (rescrie-le în stilul tău)
  // times (opțional): activitatea apare doar la orele astea, ex. times:["12:00"]; fără = toate orele
  activities: [
    { id:"dinner",   name:"Cină",              desc:"Undeva bun în centru", location:"Cluj-Napoca",
      verse:["o masă pentru doi într-un colț de oraș", "și noi, care nu ne grăbim nicăieri."] },
    { id:"coffee",   name:"Cafea & desert",    desc:"Ceva cozy",            location:"Cluj-Napoca",
      verse:["două cafele, un desert de împărțit", "și noi doi, vorbind până se răcesc."] },
    { id:"movie",    name:"Film",              desc:"Popcorn inclus",       location:"Cinema",
      verse:["o sală pe întuneric, popcorn pe genunchi", "și mâna ta găsind-o pe a mea."] },
    { id:"walk",     name:"Plimbare",          desc:"Apus și povești",      location:"Parcul Central",
      verse:["un apus care nu se grăbește", "și noi doi, pe drumul cel lung spre casă."] },
    { id:"cats",     name:"Cafenea cu pisici", desc:"Sheeba va fi geloasă", location:"Cluj-Napoca",
      verse:["o cafenea plină de pisici", "care nu se compară cu Sheeba (să nu-i spui)."] },
    { id:"surprise", name:"Surpriză",          desc:"Las-o pe mine",        location:"Secret",
      verse:["un loc pe care încă nu ți-l spun", "și noi doi, pe pagina următoare."] }
  ],
  // cum „sună" fiecare oră în poezie
  times: { "12:00":"la prânz", "15:00":"la trei, după-amiaza", "17:00":"la cinci, când se lasă seara",
           "18:30":"la șase și jumătate", "19:00":"la ora șapte seara", "20:00":"la opt, sub luminile orașului" },
  // Forma strofei: fiecare element e un rând. Placeholder-e disponibile:
  //  {zi} = ziua săptămânii („vineri"), {data} = ziua în cuvinte + luna („douăzeci și șapte noiembrie"),
  //  {ora} = fraza din `times` pentru ora aleasă (sau timeFallback), {vers1} / {vers2} = versurile activității.
  stanza: {
    lines: ["{zi}, {data},", "{ora},", "{vers1}", "{vers2}"],
    timeFallback: "la ora {hh}"   // pentru orele care nu sunt în `times`; {hh} = ora, ex. „21:15"
  },
  signature: "— scrisă împreună, R. & tu",
  eventTitle: "Strofă nouă",
  minDaysAhead: 0,

  // Zilele și orele în care ești liber. Dacă pui măcar o zi (din viitor), ea alege dintre ele
  // în loc de calendar; dacă lista e goală, alege orice zi + orice oră de mai sus.
  //  ex: [{ date:"2026-11-27", times:["18:30","20:00"] }, { date:"2026-11-29", times:["12:00"] }]
  //  (orele care nu sunt în `times` merg și ele, dar în poezie apar simplu: „la ora 21:15")
  availability: []
};

/** Servicile citesc configurarea prin acest token; testele îl pot suprascrie. */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => CONFIG,
});
