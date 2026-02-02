/**
 * Chord Progression Dataset and Utilities
 * 
 * This module provides a curated dataset of common and interesting chord progressions,
 * along with functions for filtering, transposing, and suggesting next chords.
 */

import {
    getScale,
    noteName,
    prefersFlats,
    type ModeId,
    MODAL_SIGNATURES,
    MODE_DIATONIC_7THS,
} from "./index.js";

// ============================================================================
// Types
// ============================================================================

export interface ChordProgression {
    id: string;
    name: string;
    mode: ModeId;
    type: "triad" | "seventh";
    weight: number; // 1-10, higher = more common/popular
    tags: string[];
    roman: string[];
    description?: string;
    usageExamples?: string;
}

export interface TransposedProgression extends ChordProgression {
    chords: string[]; // Actual chord symbols in the selected key
    tonic: string;
}

export interface ProgressionMatch {
    progression: ChordProgression;
    matchedIndices: number[]; // Indices in the progression's roman array that matched
    matchLength: number;
}



export interface NextChordSuggestion {
    roman: string;
    chord: string;
    frequency: number; // How often this follows in the dataset
    fromProgressions: string[]; // IDs of progressions that contain this transition
    isDiatonic: boolean; // Is it diatonic in the current mode?
    secondaryLabel?: string; // e.g. "V (Rel. Ionian)"
}


// ============================================================================
// Dataset
// ============================================================================

export const CHORD_PROGRESSIONS: ChordProgression[] = [
    // ==================== NEW: Modal Progressions (User Requested) ====================
    {
        id: "modal_dorian_vamp",
        name: "Dorian Vamp",
        mode: "dorian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "funky", "loop", "modal"],
        roman: ["i7", "IV7"],
        description: "Klassisk Dorian‑lyd hvor molltonikaen veksler med stor IV‑akkord. Den opphevede 6. tonen gir progresjonen en karakteristisk åpen og funky klang【826645563184852†L50-L88】.",
        usageExamples: "Santana – Oye Como Va, Santana – Evil Ways, Miles Davis – So What, Pink Floyd – Breathe, Pink Floyd – The Great Gig in the Sky【826645563184852†L50-L88】"
    },
    {
        id: "modal_lydian_lift",
        name: "The Lydian Lift",
        mode: "lydian",
        type: "seventh",
        weight: 8,
        tags: ["dreamy", "cinematic", "bright", "modal"],
        roman: ["I", "II", "Imaj7"], // Simplified II/I to II for now
        description: "Lydian modus (dur med hevet 4.) gir en svevende, drømmende følelse med en lys II‑akkord som løfter melodien【719065861547382†L17-L26】.",
        usageExamples: "Temaet fra The Simpsons, West Side Story – Maria, Joe Satriani – Flying in a Blue Dream【719065861547382†L17-L26】"
    },
    {
        id: "modal_mixolydian_rock",
        name: "Mixolydian Rock-n-Roll",
        mode: "mixolydian",
        type: "triad",
        weight: 9,
        tags: ["rock", "blues", "common", "modal"],
        roman: ["I", "VII", "IV"],
        description: "Denne mixolydiske progresjonen (I–bVII–IV) er grunnsteinen i rock og blues. bVII‑akkorden gir en bluesy, folkelig sound【490868884388906†L254-L276】.",
        usageExamples: "Lynyrd Skynyrd – Sweet Home Alabama, Creedence Clearwater Revival – Fortunate Son, Guns N' Roses – Sweet Child O' Mine, Bob Dylan – Like a Rolling Stone【232526284086765†L214-L223】"
    },
    {
        id: "modal_phrygian_darkness",
        name: "Phrygian Darkness",
        mode: "phrygian",
        type: "triad",
        weight: 8,
        tags: ["dark", "dramatic", "flamenco", "modal"],
        roman: ["i", "II"],
        description: "Phrygisk modus med halvtonetrinn mellom i og II skaper en spansk-klingende, mørk progresjon. II fungerer som en neapolitansk akkord som gir dramatisk spenning【946085297898792†L112-L135】.",
        usageExamples: "Del Shannon – Runaway, Pink Floyd – Cymbaline (kor), Ray Charles – Hit the Road Jack【280757061389462†L135-L150】【946085297898792†L112-L135】"
    },
    {
        id: "modal_aeolian_ballad",
        name: "Aeolian Ballad",
        mode: "aeolian",
        type: "triad",
        weight: 9,
        tags: ["pop", "melancholic", "emotional", "modal"],
        roman: ["i", "VI", "III", "VII"],
        description: "Fire‑akkords aeolisk sekvens (i–VI–III–VII) som ofte brukes i popballader. Den vandrer gjennom parallell durakkorder og skaper en sørgmodig, men håpefull stemning.",
        usageExamples: "REM – Losing My Religion, Dido – Thank You"
    },
    {
        id: "modal_locrian_tension",
        name: "Locrian Tension",
        mode: "locrian",
        type: "seventh",
        weight: 6,
        tags: ["experimental", "tension", "modal"],
        roman: ["iø7", "IImaj7"],
        description: "Locrian er den mest dissonante modusen og kombinasjonen iø7–IImaj7 skaper et ustabilt, spenningsfylt landskap. Vanlig i eksperimentell jazz og metal.",
        usageExamples: "Eksempel: improviserte jazzstykker"
    },
    {
        id: "modal_ionian_jazz",
        name: "Jazz ii-V-I (Ionian)",
        mode: "ionian",
        type: "seventh",
        weight: 10,
        tags: ["jazz", "cadence", "classical"],
        roman: ["ii7", "V7", "Imaj7"],
        description: "Dette er den klassiske ii–V–I‑kadensen i dur – en supertonika moll 7, etterfulgt av en dominant 7 som løses til maj7‑tonika. Den er grunnpilar i jazzharmonikk【500909646144683†L132-L147】.",
        usageExamples: "Jazzstandarder som Autumn Leaves og Satin Doll【500909646144683†L132-L147】"
    },

    // ==================== More Dorian ====================
    {
        id: "modal_dorian_shimmer",
        name: "Dorian Shimmer",
        mode: "dorian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "funky", "vamp"],
        roman: ["i", "ii"],
        description: "Veksling mellom molltonika og moll supertonika (i–ii). Gir et vuggende, meditativt dorisk vamp.",
        usageExamples: "Santana – Samba Pa Ti"
    },
    {
        id: "modal_dorian_open",
        name: "Dorian Open Loop",
        mode: "dorian",
        type: "triad",
        weight: 7,
        tags: ["open", "loop", "modal"],
        roman: ["i", "IV", "v", "IV"],
        description: "En lengre dorisk loop (i–IV–v–IV) som gir en åpen, hypnotisk følelse.",
        usageExamples: "Santana – Jingo"
    },
    {
        id: "modal_dorian_rock",
        name: "Dorian Rock",
        mode: "dorian",
        type: "triad",
        weight: 8,
        tags: ["rock", "fusion", "modal"],
        roman: ["i", "VII", "IV"],
        description: "i–VII–IV‑progresjon med dorisk karakter som er populær i rock og fusion.",
        usageExamples: "Carlos Santana – Evil Ways"
    },

    // ==================== More Phrygian ====================
    {
        id: "modal_phrygian_build",
        name: "Phrygian Build-up",
        mode: "phrygian",
        type: "triad",
        weight: 7,
        tags: ["tension", "release", "modal"],
        roman: ["i", "II", "III", "i"],
        description: "Bygger opp spenning med en klatrende i–II–III–i sekvens som fremhever den phrygiske b2‑akkorden.",
        usageExamples: "Flamenco‑ og filmmusikk"
    },
    {
        id: "modal_phrygian_turn",
        name: "Phrygian Dark Turn",
        mode: "phrygian",
        type: "triad",
        weight: 7,
        tags: ["dark", "classical", "modal"],
        roman: ["i", "iv", "II"],
        description: "i–iv–II‑mønster som gir en klassisk phrygisk mørk vending, ofte brukt i flamenco.",
        usageExamples: "Tradisjonell flamenco"
    },
    {
        id: "modal_phrygian_metal",
        name: "Phrygian Metal",
        mode: "phrygian",
        type: "triad",
        weight: 8,
        tags: ["metal", "dramatic", "modal"],
        roman: ["i", "VII", "II", "i"],
        description: "i–VII–II–i‑progresjon typisk i metal og dramatisk filmmusikk, med fokus på phrygisk b2.",
        usageExamples: "Metallica – Wherever I May Roam"
    },

    // ==================== More Lydian ====================
    {
        id: "modal_lydian_ascent",
        name: "Lydian Ascent",
        mode: "lydian",
        type: "triad",
        weight: 7,
        tags: ["bright", "uplifting", "modal"],
        roman: ["I", "II", "iii"],
        description: "Lydian progressjon (I–II–iii) med oppadgående bevegelse og hevet 4. som skaper et lyst, oppdriftsskapende tema.",
        usageExamples: "Joe Satriani – Flying in a Blue Dream"
    },
    {
        id: "modal_lydian_power",
        name: "Lydian Power",
        mode: "lydian",
        type: "triad",
        weight: 7,
        tags: ["powerful", "rock", "modal"],
        roman: ["I", "V", "II"],
        description: "En storslått lydian sekvens (I–V–II) som kombinerer tonika, dominant og hevet supertonika for å gi power‑akkorder.",
        usageExamples: "Rush – Freewill"
    },

    // ==================== More Mixolydian ====================
    {
        id: "modal_mixolydian_pendulum",
        name: "Mixolydian Pendulum",
        mode: "mixolydian",
        type: "triad",
        weight: 8,
        tags: ["blues", "modal"],
        roman: ["I", "v"],
        description: "Bruk av moll‑v i stedet for dur‑V i mixolydisk modus skaper en pendlende effekt mellom tonika og molldominanten.",
        usageExamples: "The Beatles – Norwegian Wood"
    },
    {
        id: "modal_mixolydian_vamp",
        name: "Mixolydian Vamp",
        mode: "mixolydian",
        type: "triad",
        weight: 8,
        tags: ["rock", "vamp", "modal"],
        roman: ["I", "VII", "I"],
        description: "En enkel vamp der tonika og bVII pendler frem og tilbake, typisk i folk‑rock.",
        usageExamples: "Van Morrison – Gloria"
    },
    {
        id: "modal_mixolydian_gospel",
        name: "Mixolydian Gospel",
        mode: "mixolydian",
        type: "triad",
        weight: 7,
        tags: ["gospel", "rock", "modal"],
        roman: ["I", "IV", "VII", "IV"],
        description: "I–IV–VII–IV‑progresjonen gir en gospel‑aktig, men tøff mixolydisk lyd.",
        usageExamples: "Toto – Hold the Line"
    },

    // ==================== More Aeolian ====================
    {
        id: "modal_aeolian_trad",
        name: "Traditional Aeolian",
        mode: "aeolian",
        type: "triad",
        weight: 8,
        tags: ["traditional", "minor", "modal"],
        roman: ["i", "iv", "v"],
        description: "Tradisjonell aeolisk i–iv–v kadens typisk i folkemusikk og klassiske komposisjoner.",
        usageExamples: "Folkesanger og ballader"
    },
    {
        id: "modal_aeolian_heroic",
        name: "Heroic Aeolian",
        mode: "aeolian",
        type: "triad",
        weight: 7,
        tags: ["heroic", "film", "dark", "modal"],
        roman: ["i", "VI", "VII"],
        description: "i–VI–VII progresjon som gir en heroisk, mørk vending ofte brukt i filmmusikk.",
        usageExamples: "Howard Shore – Ringenes Herre (Helm’s Deep tema)"
    },

    // ==================== More Locrian ====================
    {
        id: "modal_locrian_chaos",
        name: "Locrian Chaos",
        mode: "locrian",
        type: "seventh",
        weight: 5,
        tags: ["dark", "chaotic", "modal"],
        roman: ["iø7", "V", "iv"], // Using triad bV and minor iv for darkness
        description: "Locrian progression iø7–V–iv som skaper en mørk og kaotisk stemning, ofte brukt i eksperimentell jazz.",
        usageExamples: "Modern jazz improvisations"
    },


    // ==================== Major Triads - Common ====================
    {
        id: "maj_tri_01",
        name: "4 chord",
        mode: "ionian",
        type: "triad",
        weight: 10,
        tags: ["common", "pop", "loop", "modern", "ballad"],
        roman: ["I", "V", "vi", "IV"],
        description: "Svært vanlig fire-akkords progresjon som bruker tonika (I), dominant (V), parallell moll (vi) og subdominant (IV). Kjent som «Axis of Awesome»-progresjonen og er svært utbredt i moderne pop.",
        usageExamples: "Ben E. King – Stand by Me, U2 – With or Without You, Journey – Don't Stop Believin', Lady Gaga – Poker Face, Encanto – Colombia, Mi Encanto"
    },
    {
        id: "modal_mixolydian_flat7_iv",
        name: "I–V–♭VII–IV",
        mode: "mixolydian",
        type: "triad",
        weight: 9,
        tags: ["rock", "pop", "bluesy", "mixolydian"],
        roman: ["I", "V", "bVII", "IV"],
        description: "En variasjon av I–V–vi–IV der submedianten byttes ut med subtonika (bVII). Dette gir en bluesaktig touch og en harmonisk drive gjennom to I–V bevegelser (A–E og G–D).",
        usageExamples: "Lay Lady Lay, (You Make Me Feel Like) A Natural Woman, Turning Japanese, Waterfalls, Don't Tell Me, Cinnamon Girl, Brown Eyes, Rio, Sugar Hiccup, Sweet Jane, Cop Killer, And She Was, Let's Go Crazy, Like a Rock, Steady, As She Goes, American Idiot"
    },
    {
        id: "maj_tri_02",
        name: "Sensitive Female Chord Progression",
        mode: "ionian",
        type: "triad",
        weight: 10,
        tags: ["common", "pop", "loop"],
        roman: ["vi", "IV", "I", "V"],
        description: "Omrotasjon av I–V–vi–IV. Progresjonen starter på parallell moll (vi) og går via subdominanten (IV) og tonika (I) til dominanten (V). Den kalles ofte «Sensitive female chord progression» og brukes i popballader【81920227757805†L19-L27】.",
        usageExamples: "Beyoncé – If I Were a Boy, Taylor Swift – All Too Well【161001883971269†L332-L341】"
    },
    {
        id: "maj_tri_03",
        name: "Classic Pop Ballad",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["common", "pop", "ballad"],
        roman: ["I", "vi", "IV", "V"],
        description: "Fire-akkords kjernestruktur også kjent som 50‑talls-progresjonen. Består av tonika (I), parallell moll (vi), subdominant (IV) og dominant (V) og ble mye brukt i doo‑wop og tidlig rock【996809291168208†L128-L136】.",
        usageExamples: "The Everly Brothers – All I Have to Do Is Dream, The Penguins – Earth Angel, Ben E. King – Stand by Me【996809291168208†L200-L233】"
    },
    {
        id: "maj_tri_04",
        name: "12-Bar Blues (kort)",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["common", "rock", "blues"],
        roman: ["I", "IV", "V", "I"],
        description: "Første fire takter i tolv‑takters blues (I–IV–V–I). Denne sekvensen danner grunnlaget i en standard 12‑bar blues, hvor tonika, subdominant og dominant skaper en kontinuerlig syklus【852342052639457†L15-L22】.",
        usageExamples: "Elvis Presley – Hound Dog, Elvis Presley – Don’t Be Cruel【852342052639457†L42-L47】"
    },
    {
        id: "maj_tri_05",
        name: "Three Chord Rock",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["common", "rock"],
        roman: ["I", "IV", "V"],
        description: "Klassisk tre‑akkords progresjon som bruker tonika (I), subdominant (IV) og dominant (V). Dette er grunnsteinen i rock, folk, country og pop og danner basis for 12‑takters blues【254329089442220†L64-L90】.",
        usageExamples: "Bob Dylan – Blowin' in the Wind, Johnny Cash – Ring of Fire, Chuck Berry – Johnny B. Goode【254329089442220†L64-L90】"
    },
    {
        id: "maj_tri_06",
        name: "50s Doo-Wop",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "50s", "vintage"],
        roman: ["I", "vi", "ii", "V"],
        description: "Variant av den klassiske 50‑talls‑progresjonen der subdominanten (IV) erstattes av supertonikaen (ii). Den følger kretsen av kvinter (I–vi–ii–V) og brukes i pop‑ og jazzstandarder【996809291168208†L128-L136】.",
        usageExamples: "Carmichael & Loesser – Heart and Soul, Rodgers & Hart – Blue Moon【996809291168208†L200-L233】"
    },
    {
        id: "maj_tri_07",
        name: "Simple ii-V-I",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "pop", "cadence"],
        roman: ["I", "ii", "V", "I"],
        description: "En glad og tidløs I–ii–V–I progresjon der tonika (I) etterfølges av supertonika (ii), dominant (V) og vender tilbake til tonika. Den gir en positiv og oppløftende følelse【199273111915208†L315-L333】.",
        usageExamples: "Meghan Trainor – All About That Bass【199273111915208†L345-L349】"
    },
    {
        id: "maj_tri_08",
        name: "Pop Anthemic",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "pop", "anthemic"],
        roman: ["I", "iii", "IV", "V"],
        description: "Også kalt Puff‑skjemaet. Denne fire‑akkords sekvensen bruker tonika (I), mediant (iii), subdominant (IV) og dominant (V). Det gir en optimistisk oppbygning og har blitt brukt i mange pop‑ og soul‑klassikere【871514365443095†L96-L116】.",
        usageExamples: "Peter, Paul and Mary – Puff the Magic Dragon, Marvin Gaye – Let's Get It On, The Band – The Weight, Radiohead – Creep【871514365443095†L96-L116】"
    },
    {
        id: "maj_tri_09",
        name: "Emotional Rise",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "pop"],
        roman: ["I", "vi", "iii", "IV"],
        description: "Variant av fire‑akkords pop‑progresjonen der tonika (I) går til parallell moll (vi), mediant (iii) og subdominant (IV). Denne ordningen gir en gradvis oppbygging med emosjonell intensitet og brukes i ballader og popballader【735138814438172†L191-L197】.",
        usageExamples: "James Arthur – Say You Won’t Let Go【735138814438172†L191-L197】"
    },
    {
        id: "maj_tri_10",
        name: "Driving Pop",
        mode: "ionian",
        type: "triad",
        weight: 7,
        tags: ["common", "pop"],
        roman: ["I", "V", "IV", "V"],
        description: "En energisk 1‑5‑4‑5 progresjon. Ved å alternere mellom tonika (I) og dominant (V) med subdominant (IV) i midten får man en drivende, fengende rytme som er grunnlaget for mange rock- og poplåter【600196390006495†L45-L51】.",
        usageExamples: "The Rascals – Good Lovin', The Beatles – Twist and Shout, Ritchie Valens – La Bamba, The Beach Boys – Surfin’ U.S.A., The Kingsmen – Louie Louie, The Bobby Fuller Four – I Fought the Law【600196390006495†L45-L109】"
    },
    {
        id: "maj_tri_11",
        name: "Folk Standard",
        mode: "ionian",
        type: "triad",
        weight: 7,
        tags: ["common", "folk"],
        roman: ["I", "IV", "I", "V"],
        description: "En av de eldste fire‑akkords sekvensene: tonika (I) går til subdominanten (IV), tilbake til tonika og videre til dominanten (V). Denne progresjonen er sentral i folk og country【727819319881554†L16-L37】.",
        usageExamples: "Kris Kristofferson – The Pilgrim, Chapter 33; R.E.M. – Everybody Hurts; Bob Seger – Katmandu; Ray Charles – I Can't Stop Loving You【727819319881554†L16-L37】"
    },
    {
        id: "maj_tri_12",
        name: "Mixolydian Rock",
        mode: "ionian", // Usually described in major, but uses bVII
        type: "triad",
        weight: 7,
        tags: ["common", "rock", "mixolydian"],
        roman: ["I", "bVII", "IV", "I"],
        description: "Mixolydisk preget rock‑progresjon der tonika (I) veksler med bVII og subdominant (IV). Den b7‑te tonen skaper en folkelig rock/funk‑klang som er karakteristisk for amerikansk rock【490868884388906†L254-L276】.",
        usageExamples: "Lady Gaga – Born This Way, Creedence Clearwater Revival – Fortunate Son, Guns N' Roses – Sweet Child O' Mine (vers), The Beatles – Hey Jude【232526284086765†L214-L223】"
    },
    {
        id: "maj_tri_13",
        name: "Sweet Child Riff",
        mode: "ionian",
        type: "triad",
        weight: 7,
        tags: ["common", "rock", "mixolydian"],
        roman: ["I", "bVII", "IV"],
        description: "Trerad variant av mixolydisk rock der tonika (I) går til bVII og subdominanten (IV). Denne sekvensen brukes i sørstatsrock og skaper et åpent, storslått uttrykk【490868884388906†L254-L276】.",
        usageExamples: "Lynyrd Skynyrd – Sweet Home Alabama, Tom Petty – American Girl, Guns N' Roses – Sweet Child O' Mine (intro)【232526284086765†L214-L223】"
    },
    {
        id: "maj_tri_14",
        name: "Deceptive Resolution",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["common", "pop", "deceptive"],
        roman: ["I", "V", "vi"],
        description: "I en såkalt avbrutt eller bedragersk kadens går den sterke dominanten (V) til parallell moll (vi) i stedet for tonika, noe som skaper et overraskende, men naturlig lydende skifte【700572549872289†L118-L126】.",
        usageExamples: "The Police – Every Breath You Take【700572549872289†L161-L171】"
    },
    {
        id: "maj_tri_15",
        name: "ii-V-I Kadens",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["common", "cadence", "jazz"],
        roman: ["ii", "V", "I"],
        description: "Den vanlige ii–V–I‑kadensen i dur, der supertonikaen (ii) går til dominanten (V) og løses til tonika (I). Dette er en hyppig kadens i jazz og populærmusikk【500909646144683†L132-L147】.",
        usageExamples: "Standardlåter som Honeysuckle Rose og Satin Doll【500909646144683†L132-L147】"
    },
    {
        id: "maj_tri_16",
        name: "Autentisk Kadens",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["common", "cadence", "classical"],
        roman: ["IV", "V", "I"],
        description: "Kombinert subdominant‑dominant‑tonika (IV–V–I) kadens. Subdominanten forbereder den sterke V–I‑oppløsningen og gir en fyldigere avslutning enn ren V–I【882085323898420†L200-L208】.",
        usageExamples: "John Lennon – Imagine【882085323898420†L247-L268】"
    },

    // ==================== Major - Modal Interchange & Color ====================
    {
        id: "maj_adv_01",
        name: "Minor Plagal",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["modal_interchange", "color", "emotional"],
        roman: ["I", "iv", "IV", "I"],
        description: "Kombinerer en lånt moll‑subdominant (iv) fra parallell moll med den vanlige dur‑subdominanten (IV) før retur til tonika. Denne plagal‑variasjonen gir en myk, melankolsk overgang som ofte brukes i ballader og gospel【490868884388906†L144-L170】.",
        usageExamples: "Simon & Garfunkel – Bridge Over Troubled Water (F–Fm–C), Beatles – If I Fell【490868884388906†L144-L170】"
    },
    {
        id: "maj_adv_02",
        name: "Borrowed iv-bVII",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["modal_interchange", "color"],
        roman: ["I", "iv", "bVII", "I"],
        description: "Denne progresjonen blander et lånt moll‑iv fra parallell moll med en bVII‑akkord fra mixolydisk modus. Resultatet er en rik kombinasjon av introspeksjon og folk‑rock‑grus som gir en særegen farge【490868884388906†L144-L170】【490868884388906†L254-L276】.",
        usageExamples: "Outkast – Hey Ya!, Lynyrd Skynyrd – Sweet Home Alabama (vers)【490868884388906†L254-L276】"
    },
    {
        id: "maj_adv_03",
        name: "Epic Borrowed (Mario Kadens)",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["modal_interchange", "color", "epic"],
        roman: ["I", "bVI", "bVII", "I"],
        description: "Også kalt Mario‑kadensen. Her brukes to lånte akkorder, bVI og bVII, som leder triumferende tilbake til tonika. Denne modalblandingen er utbredt i dataspillmusikk og gir en heroisk avslutning【766927516124175†L21-L50】【766927516124175†L64-L86】.",
        usageExamples: "Koji Kondo – tema fra Super Mario Bros. (nivåslutt)【766927516124175†L64-L86】"
    },
    {
        id: "maj_adv_04",
        name: "Chromatic Median",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["modal_interchange", "color"],
        roman: ["I", "bIII", "IV", "I"],
        description: "Bruker en kromatisk mediant (bIII) for å overraske øret mellom tonika og subdominant. Denne typen modulering har blitt brukt av filmkomponister for å skape magiske overganger.",
        usageExamples: "Hans Zimmer – filmmusikk"
    },
    {
        id: "maj_adv_05",
        name: "Dramatic Borrowed",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["modal_interchange", "color", "dramatic"],
        roman: ["I", "bVI", "IV", "V"],
        description: "Låner bVI fra parallell moll som sammen med subdominant (IV) og dominant (V) gir et dramatisk oppsving før oppløsning. bVI‑akkorden tilfører mørk varme og følelsesmessig dybde【490868884388906†L144-L170】.",
        usageExamples: "The Beatles – While My Guitar Gently Weeps (C–Am7–F–G)【490868884388906†L144-L170】"
    },
    {
        id: "maj_adv_06",
        name: "Passing Diminished",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["chromatic", "passing"],
        roman: ["I", "#iv°", "V", "I"],
        description: "En kromatisk overgang der en #iv°‑diminuert akkord fungerer som en forbigående ledetone mellom tonika (I) og dominant (V) før oppløsning tilbake til tonika. Slike passasjer brukes ofte i blues og jazz.",
        usageExamples: "Jazz-standarder med kromatiske passeringsakkorder"
    },
    {
        id: "maj_adv_07",
        name: "Chromatic Approach to ii",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["chromatic", "passing"],
        roman: ["I", "#i°", "ii", "V"],
        description: "Bruker en #i°‑diminuert akkord som kromatisk overgang fra tonika til supertonika (ii) før oppløsning til dominanten (V). Dette skaper en snikende bevegelse som ofte høres i jazz.",
        usageExamples: "Jazz-arrangementer med kromatiske tilnærminger"
    },
    {
        id: "maj_adv_08",
        name: "Kvintsirkel",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["sequence", "circle_of_fifths", "classical"],
        roman: ["I", "IV", "vii°", "iii", "vi", "ii", "V", "I"],
        description: "En sekvens som følger kvintsirkelen rundt, der hver akkord leder til neste i en fallende femte eller stigende kvart. Denne klassiske rekkefølgen brukes ofte i barokk og jazz for å skape fremdrift.",
        usageExamples: "J.S. Bach – preludier og fuger"
    },

    // ==================== Major - Secondary Dominants ====================
    {
        id: "maj_sec_01",
        name: "V/V til V",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["secondary_dominant", "common"],
        roman: ["I", "V7/V", "V", "I"],
        description: "Introduksjon av en sekundærdominant V7/V (dominant til dominanten) som forsterker oppløsningen til V før progresjonen returnerer til tonika. Sekundærdominanter inneholder ofte kromatiske toner utenfor nøkkelen【554341427261776†L49-L54】.",
        usageExamples: "Bangles – Eternal Flame (A7 peker mot D), Charlie Puth – One Call Away (F7 peker mot B♭m)【554341427261776†L119-L148】"
    },
    {
        id: "maj_sec_02",
        name: "V/vi til vi",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["secondary_dominant", "common"],
        roman: ["I", "V7/vi", "vi", "IV"],
        description: "Sekundærdominanten V7/vi (dominant til parallell moll) leder til vi og skaper et midlertidig sidetonalt fokus før subdominanten IV. Denne fremgangsmåten gir en overraskende harmonisk vending【554341427261776†L119-L148】.",
        usageExamples: "Charlie Puth – One Call Away: F7 (V7/vi) til B♭m (vi)【554341427261776†L119-L131】"
    },
    {
        id: "maj_sec_03",
        name: "V/ii i Kadens",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["secondary_dominant"],
        roman: ["I", "V7/ii", "ii", "V", "I"],
        description: "Her introduseres V7/ii som en dominant til supertonikaen (ii), som deretter går til den vanlige dominant V og til slutt til tonika. Sekvensen øker spenningen gjennom midlertidige tonale sentre【670140029442691†L288-L329】.",
        usageExamples: "Handel – Zadok the Priest (bruk av sekundærdominanter)【670140029442691†L390-L393】"
    },
    {
        id: "maj_sec_04",
        name: "V/IV til IV",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["secondary_dominant"],
        roman: ["I", "V7/IV", "IV", "V", "I"],
        description: "En sekundærdominant på IV‑trinnet (V7/IV) leder til subdominanten (IV) før standard V–I‑kadens. Brukes for å fremheve subdominanten med ekstra kromatisk farge【670140029442691†L288-L329】.",
        usageExamples: "The Beatles – Yesterday (sekundærdominanter til IV)【670140029442691†L390-L393】"
    },
    {
        id: "maj_sec_05",
        name: "Turnaround med Sekundærdominanter",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["secondary_dominant", "turnaround"],
        roman: ["I", "III7", "vi", "II7", "V7", "I"],
        description: "En turnaround som benytter flere sekundærdominanter: III7 (V/vi) leder til vi, deretter II7 (V/V) før den vanlige V7–I‑oppløsningen. Slike sekvenser skaper jazzete fremdrift og modulering【554341427261776†L49-L54】.",
        usageExamples: "Standardlåter i jazz og gospel"
    },

    // ==================== Major - Jazz ====================
    {
        id: "maj_jazz_01",
        name: "Jazz Standard Turnaround",
        mode: "ionian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "common", "turnaround"],
        roman: ["Imaj7", "vi7", "ii7", "V7"],
        description: "Klassisk jazzturnaround der tonika med maj7 går til den relative moll (vi7), supertonika (ii7) og deretter til dominant (V7). Denne progresjonen brukes i utallige standards og danner grunnlaget for improvisasjon.",
        usageExamples: "George Gershwin – I Got Rhythm (A‑del), Duke Ellington – Satin Doll"
    },
    {
        id: "maj_jazz_02",
        name: "ii-V-I (Jazz)",
        mode: "ionian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "common", "cadence"],
        roman: ["ii7", "V7", "Imaj7"],
        description: "Den klassiske ii–V–I progresjonen i jazz. Her går en mollakkord på supertonika (ii7) til en dominant syvende på kvinten (V7) før oppløsning til tonika med maj7 (Imaj7). Denne kadensen er grunnpilar i jazzharmonikk【500909646144683†L132-L147】.",
        usageExamples: "Vanlige jazzstandarder som Honeysuckle Rose og Satin Doll benytter ii–V–I‑kadensen【500909646144683†L132-L147】"
    },
    {
        id: "maj_jazz_03",
        name: "Turnaround med VI7",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "turnaround"],
        roman: ["Imaj7", "VI7", "ii7", "V7"],
        description: "Variasjon av standardturnaround der VI7 (dominant på mediant) erstatter den diatoniske vi7. VI7 fungerer som sekundærdominant og gir bluesaktig spenning før ii–V–I.",
        usageExamples: "Jazzlåter med bluespreg"
    },
    {
        id: "maj_jazz_04",
        name: "Rhythm Changes (A-del)",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "rhythm_changes"],
        roman: ["iii7", "VI7", "ii7", "V7", "Imaj7"],
        description: "Harmoni fra A‑delen av Rhythm Changes. Her følger akkordene en iii–VI–ii–V–I‑sekvens som danner grunnlaget for utallige bebop‑soli.",
        usageExamples: "Charlie Parker – Anthropology, Dizzy Gillespie – Salt Peanuts"
    },
    {
        id: "maj_jazz_05",
        name: "Passing Diminished (Jazz)",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["jazz", "chromatic", "passing"],
        roman: ["Imaj7", "#i°7", "ii7", "V7", "Imaj7"],
        description: "Innfører en #i°7‑diminuert syvende akkord mellom tonika og supertonika. Den kromatiske passeringsakkorden gir en elegant overgang i jazzstandarder.",
        usageExamples: "Standards som 'Misty' benytter kromatiske passeringsakkorder"
    },
    {
        id: "maj_jazz_06",
        name: "Backdoor ii-V",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["jazz", "backdoor"],
        roman: ["Imaj7", "iv7", "bVII7", "Imaj7"],
        description: "Backdoor‑progresjon der en moll iv7 går til bVII7 før oppløsning til Imaj7. Denne substitusjonen erstatter den vanlige V7 og gir en mykere, bluesaktig overgang【712155671948666†L50-L54】.",
        usageExamples: "Tadd Dameron – Lady Bird, Erroll Garner – Misty【712155671948666†L50-L54】"
    },
    {
        id: "maj_jazz_07",
        name: "Tritone Substitution (ii-bII-I)",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["jazz", "tritone_sub"],
        roman: ["ii7", "bII7", "Imaj7"],
        description: "Bytter ut den vanlige V7 med en dominant en tritonus unna (bII7). Tritone‑substitusjonen deler 3. og 7. med den opprinnelige V7 og gir en kromatisk basslinje【85222349922786†L111-L121】.",
        usageExamples: "Standardlåter med tritone‑substitusjoner"
    },
    {
        id: "maj_jazz_08",
        name: "Direct Tritone Sub",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["jazz", "tritone_sub"],
        roman: ["Imaj7", "bII7", "Imaj7"],
        description: "Enkel effekt der bII7 fungerer som forbigående dominant før retur til Imaj7. Gir moderne jazz en dristig kromatikk【85222349922786†L111-L121】.",
        usageExamples: "Moderne jazz og fusion"
    },

    // ==================== Minor Triads - Common ====================
    {
        id: "min_tri_01",
        name: "Andalusian Moll",
        mode: "aeolian",
        type: "triad",
        weight: 10,
        tags: ["common", "aeolian", "loop"],
        roman: ["i", "bVII", "bVI", "V"],
        description: "Kjent som den andalusiske kadensen: en nedadgående sekvens i moll der i–bVII–bVI–V skaper en spansk/flamenco‑aktig stemning【280757061389462†L135-L150】. Progresjonen brukes ofte som vamp i pop og rock.",
        usageExamples: "Del Shannon – Runaway, Ray Charles – Hit the Road Jack【280757061389462†L135-L150】"
    },
    {
        id: "min_tri_02",
        name: "Moll med Dur-V",
        mode: "aeolian",
        type: "triad",
        weight: 9,
        tags: ["common", "minor", "cadence"],
        roman: ["i", "iv", "V", "i"],
        description: "Typisk moll‑kadens der den rene i–iv–V–i sekvensen brukes i blues og latin. Dominanten er en dur‑V som gir en sterk oppløsning tilbake til molltonika【597104395790003†L339-L352】.",
        usageExamples: "Santana – Black Magic Woman, B.B. King – The Thrill Is Gone【597104395790003†L339-L352】"
    },
    {
        id: "min_tri_03",
        name: "Natural Minor Loop",
        mode: "aeolian",
        type: "triad",
        weight: 8,
        tags: ["common", "natural_minor"],
        roman: ["i", "bVI", "bIII", "bVII"],
        description: "En loop i naturlig moll der i går til bVI, bIII og bVII. Denne varianten gir en melankolsk, men oppløftende følelse og brukes i folk og rock【597104395790003†L394-L414】.",
        usageExamples: "Simon & Garfunkel – The Sound of Silence, Dolly Parton – Jolene (variasjon med bIII og bVII)【597104395790003†L394-L414】【597104395790003†L378-L390】"
    },
    {
        id: "min_tri_04",
        name: "Fallende Linje",
        mode: "aeolian",
        type: "triad",
        weight: 8,
        tags: ["common", "minor", "color"],
        roman: ["i", "bVII", "bVI", "V"],
        description: "Nedadgående i–bVII–bVI–V, også kalt den fallende basslinjen. Denne sekvensen finnes i rock, pop og folk og gir en episk stigende følelse når den løser til V【597104395790003†L419-L444】.",
        usageExamples: "Bob Dylan / Jimi Hendrix – All Along the Watchtower, Led Zeppelin – Stairway to Heaven, Gotye – Somebody That I Used to Know, Stray Cats – Stray Cat Strut【597104395790003†L419-L444】"
    },
    {
        id: "min_tri_05",
        name: "Pop Moll",
        mode: "aeolian",
        type: "triad",
        weight: 7,
        tags: ["common", "minor", "pop"],
        roman: ["i", "iv", "bVII", "bIII"],
        description: "Variasjon i moll der subdominanten (iv) går til bVII og bIII. Denne kombinasjonen gir en mørk, men samtidig fengende karakter og brukes i rock og pop【597104395790003†L378-L390】.",
        usageExamples: "Dolly Parton – Jolene, Pink Floyd – Another Brick in the Wall (chorus)【597104395790003†L378-L390】"
    },
    {
        id: "min_tri_06",
        name: "Dramatisk Moll",
        mode: "aeolian",
        type: "triad",
        weight: 7,
        tags: ["common", "minor", "dramatic"],
        roman: ["i", "bVI", "iv", "V"],
        description: "Denne progresjonen kombinerer bVI fra parallell dur med moll-subdominanten (iv) og dominanten (V). Det gir et dramatisk uttrykk og beveger seg mellom lys og mørke【597104395790003†L394-L414】.",
        usageExamples: "The Beatles – Eleanor Rigby (i–bVI), Simon & Garfunkel – The Sound of Silence (i–bVI–bIII–bVII)【597104395790003†L394-L414】"
    },
    {
        id: "min_tri_07",
        name: "Enkel Moll-kadens",
        mode: "aeolian",
        type: "triad",
        weight: 7,
        tags: ["common", "minor"],
        roman: ["i", "bVI", "V", "i"],
        description: "En enkel moll‑kadens der bVI leder til den sterke dominanten (V) før retur til i. Den gir en løftende, men mørk bevegelse【597104395790003†L394-L414】.",
        usageExamples: "Eleanor Rigby – refreng, Sound of Silence – bridge【597104395790003†L394-L414】"
    },
    {
        id: "min_tri_08",
        name: "iv-V-i Kadens",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["common", "minor", "cadence"],
        roman: ["iv", "V", "i"],
        description: "Klassisk moll‑kadens der mollsubdominanten (iv) går til durdominanten (V) før oppløsning til i. Brukes i mange folketoner og blues【597104395790003†L339-L352】.",
        usageExamples: "Tradisjonell blues og folkemusikk【597104395790003†L339-L352】"
    },
    {
        id: "min_tri_09",
        name: "Melankolsk Moll",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["common", "minor", "melancholic"],
        roman: ["i", "v", "iv", "i"],
        description: "En melankolsk i–v–iv–i progresjon hvor den harmoniske molldominanten (v) gir et svevende uttrykk før det løses til iv og tilbake til i. Brukes i blues og latin【597104395790003†L339-L352】.",
        usageExamples: "Santana – Black Magic Woman (vers), klassiske mollballader【597104395790003†L339-L352】"
    },
    {
        id: "min_tri_10",
        name: "Moll Fargerik",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["minor", "color"],
        roman: ["i", "bIII", "bVII", "iv"],
        description: "Kombinerer bIII og bVII fra parallell dur før retur til iv. Denne sekvensen gir en moderne og rik klang som brukes i pop og rock【597104395790003†L378-L390】.",
        usageExamples: "Pink Floyd – Another Brick in the Wall (kor), Dolly Parton – Jolene (variasjon)【597104395790003†L378-L390】"
    },

    // ==================== Minor - Advanced ====================
    {
        id: "min_adv_01",
        name: "Napolitansk Sekst",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["neapolitan", "color", "classical"],
        roman: ["i", "bII", "V", "i"],
        description: "Progresjon med den såkalte napolitanske sekstakkorden (bII), en majorakkord på senket andre trinn. bII fungerer som et forhøyet subdominant for å skape intensitet før dominanten og returnerer til i【946085297898792†L112-L135】.",
        usageExamples: "Pink Floyd – Cymbaline (VI–II–VI–II–i), David Bowie – Space Oddity (Fmaj7–Em), Tame Impala – New Person, Same Old Mistakes (Cm–Db–Ab–Cm)【946085297898792†L112-L135】【453737271152216†L66-L115】"
    },
    {
        id: "min_adv_02",
        name: "Kromatisk Passing (Moll)",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["chromatic", "passing"],
        roman: ["i", "#iv°", "V", "i"],
        description: "Innslag av en #iv°‑diminuert akkord som kromatisk overgang mellom i og V før retur til molltonika. En dramatisk effekt brukt i klassiske stykker og film. ",
        usageExamples: "Klassiske verk og filmmusikk"
    },
    {
        id: "min_adv_03",
        name: "Moll Kvintsirkel",
        mode: "aeolian",
        type: "triad",
        weight: 5,
        tags: ["sequence", "circle_of_fifths"],
        roman: ["i", "iv", "bVII", "bIII", "bVI", "ii°", "V", "i"],
        description: "En sirkel av kvinter i moll der akkordene følger fallende femter (i–iv–bVII–bIII–bVI–ii°–V–i). Denne sekvensen gir en følelse av modulering og er vanlig i barokk og jazz.",
        usageExamples: "Barokke variasjonsverk"
    },
    {
        id: "min_adv_04",
        name: "Picardy-ters Avslutning",
        mode: "aeolian",
        type: "triad",
        weight: 5,
        tags: ["picardy", "ending", "classical"],
        roman: ["i", "iv", "V", "I"],
        description: "Avslutter et stykke i moll med en durtonika (Picardy-ters). Etter i–iv–V slutter progresjonen uventet på en dur I, noe som gir en lys avslutning på et mørkt verk.",
        usageExamples: "Johann Sebastian Bach – koraler med Picardy-ters"
    },

    // ==================== Minor - Jazz ====================
    {
        id: "min_jazz_01",
        name: "Minor ii-V-i (Jazz)",
        mode: "aeolian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "common", "cadence"],
        roman: ["iiø7", "V7", "i6"],
        description: "Den grunnleggende moll ii–V–i‑kadensen: en halvdiminuert iiø7 går til en dominant 7 som deretter løses til molltonikaen (ofte med 6‑te på toppen). Den er vanlig i jazz og latin og gir et mørkt, sofistikert sound【547681610103324†L73-L76】【547681610103324†L87-L93】.",
        usageExamples: "Jazzstandarder som Blue Bossa og Autumn Leaves"
    },
    {
        id: "min_jazz_02",
        name: "Minor Turnaround",
        mode: "aeolian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "turnaround"],
        roman: ["i6", "VI7", "iiø7", "V7"],
        description: "En mollturnaround der tonika med 6 går til VI7 (sekundærdominant til iiø7) før iiø7–V7‑oppløsning. Brukes i jazz og bossa nova for å skape runde sekvenser.",
        usageExamples: "Jazzlåter som Tune Up"
    },
    {
        id: "min_jazz_03",
        name: "Minor Backdoor",
        mode: "aeolian",
        type: "seventh",
        weight: 7,
        tags: ["jazz", "backdoor"],
        roman: ["i7", "iv7", "bVII7", "i7"],
        description: "Backdoor‑versjon i moll der iv7 går til bVII7 før oppløsning til i7. Denne subdominant‑erstatningen gir en mild overgang til tonika【712155671948666†L50-L54】.",
        usageExamples: "Jazzstandarder som Lady Bird og Misty【712155671948666†L50-L54】"
    },
    {
        id: "min_jazz_04",
        name: "Minor Tritone Sub",
        mode: "aeolian",
        type: "seventh",
        weight: 6,
        tags: ["jazz", "tritone_sub"],
        roman: ["iiø7", "bII7", "i6"],
        description: "Erstatter den vanlige V7 med bII7, som er en tritonus unna. Denne substitusjonen deler de viktige tonene med V7 og gir en kromatisk tilbakeføring til molltonika【85222349922786†L111-L121】.",
        usageExamples: "Moderne jazz og latin med tritone‑substitusjoner"
    },

    // ==================== NEW: User Added Progressions ====================
    {
        id: "user_50s_prog",
        name: "50s Progression (Heart and Soul)",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["pop", "doo-wop", "classic", "50s"],
        roman: ["I", "vi", "IV", "V"],
        description: "Fire-akkords grunnform som preger tidlig pop og doo-wop.",
        usageExamples: "The Penguins – 'Earth Angel', Ben E. King – 'Stand by Me'"
    },
    {
        id: "user_iv_v_i_vi",
        name: "IV–V–I–vi",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["pop", "verse", "variation"],
        roman: ["IV", "V", "I", "vi"],
        description: "Variant av fire‑akkords pop‑progresjonen som starter på subdominanten (IV) og går via dominanten (V) til tonika (I) før den lander i parallell moll (vi). Dette gir et varmt og nostalgisk preg.",
        usageExamples: "Ben E. King – Stand by Me (bro), The Beatles – Let It Be"
    },

    {
        id: "user_mixolydian_rock_ii",
        name: "I–IV–bVII–IV",
        mode: "mixolydian",
        type: "triad",
        weight: 8,
        tags: ["rock", "modal", "mixolydian"],
        roman: ["I", "IV", "VII", "IV"],
        description: "I–IV–bVII–IV er en mixolydisk rockprogresjon der den hevede 7. trinnet gir en folk‑rock farge. Den minner om I–bVII–IV men starter på IV.",
        usageExamples: "Lynyrd Skynyrd – Sweet Home Alabama (refrenget)"
    },
    {
        id: "user_jazz_ii_v_i",
        name: "ii–V–I (Standard Jazz)",
        mode: "ionian",
        type: "seventh",
        weight: 10,
        tags: ["jazz", "cadence", "theory"],
        roman: ["ii7", "V7", "Imaj7"],
        description: "Grunnleggende kadens i jazz og mye funksjonell harmonikk.",
        usageExamples: "Standardlåter som 'Autumn Leaves'"
    },
    {
        id: "user_tritone_sub_ii_bii_i",
        name: "ii–bII7–I (ii–V–I med tritone-substitusjon)",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "tritone_sub", "cadence"],
        roman: ["ii7", "bII7", "Imaj7"],
        description: "Bytter ut V7 med bII7 (tritone‑substitusjon) før oppløsning til I. bII7 deler viktige toner med V7 og gir en kromatisk glidebane【85222349922786†L111-L121】.",
        usageExamples: "Jazzstandarder med tritone‑substitusjon"
    },
    {
        id: "user_ragtime_cadence",
        name: "vii°7/V–V–I (vanlig i ragtime)",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["ragtime", "cadence", "secondary_dominant"],
        roman: ["vii°7/V", "V7", "I"],
        description: "I ragtime kalles denne vii°7/V–V–I sekvensen ragtime cadence. Den introduserer en sekundær ledetone‑akkord (vii°7/V) som leder til dominanten og deretter til tonika for en snerten, gammel-dags avslutning.",
        usageExamples: "Scott Joplin – Maple Leaf Rag"
    },
    {
        id: "user_andalusian_phrygian_dominant",
        name: "Andalusisk kadens",
        mode: "phrygian", // Approximating Phrygian Dominant (major I) using Phrygian mode logic but ensuring major Tonic? 
        // Note: Standard Phrygian has minor i. Andalusian often ends on Major I (Picardy) or is V of Harmonic Minor.
        // User inputs: iv, III, bII, I. 
        // In Phrygian: i is default. To get I, we use "I" (major).
        // iv is normal in Phrygian (iv). 
        // III (major) is bIII relative to major scale, but in Phrygian (1 b2 b3 4 5 b6 b7), degree 3 is b3. 
        // Wait, Phrygian: 1 b2 b3 4 5 b6 b7.
        // Andalusian in A minor (A G F E): i - bVII - bVI - V. 
        // User wrote: iv - III - bII - I. This seems to be relative to the Phrygian Tonic as "I"? 
        // E.g. in E Phrygian (E F G A B C D)
        // iv = Am. III = G? No, III usually means Major 3rd. bIII means minor 3rd degree major chord.
        // Let's assume standard Andalusian: Am G F E.
        // If Tonic is E (Phrygian). 
        // iv = Am.
        // III = G? In Phrygian 3rd is G (b3). So bIII (G)? 
        // bII = F.
        // I = E major. 
        // The user input says: ["iv", "III", "bII", "I"] for "Frygisk dominant".
        // Let's stick to valid Roman numerals for our parser. 
        // "I" = Major Tonic. "bII" = Major on b2. "III"? Major on 3? Or b3?
        // In Phrygian mode context:
        // i -> bVII -> bVI -> V (if seen as minor key). 
        // If the user says "iv - III - bII - I", let's map it to what makes sense in Phrygian Dominant (5th mode of Harmonic Minor).
        // Phrygian Dominant on E: E F G# A B C D.
        // Chords: E(I), F(II?), G#dim, Am(iv), Bdim(v°), C(bVI), Dm(bvii). 
        // Wait, phrygian dominant is 1 b2 3 4 5 b6 b7.
        // I = E. II = F. iv = Am. bVII = Dm? No b7 is D. D minor? 
        // User says: "iv - III - bII - I".
        // Let's interpret "Ray Charles - Hit the Road Jack" (Am G F E).
        // That is i - bVII - bVI - V in A minor.
        // OR it is iv - bIII - bII - I in E Phrygian (if E is I).
        // Am (iv), G (bIII), F (bII), E (I).
        // So User's "III" probably means "bIII" (G major chord in E phrygian).
        // And "bII" is F major.
        // And "I" is E major.
        // So we use Phrygian mode, but with specific chords.
        type: "triad",
        weight: 9,
        tags: ["flamenco", "dramatic", "theory"],
        roman: ["iv", "bIII", "bII", "I"], // Using bIII for clarity, I for major finish
        description: "Nedadgående kadens som ofte gir en «spansk»/flamenco-preget farge.",
        usageExamples: "Ray Charles – 'Hit the Road Jack'"
    },
    {
        id: "user_backdoor",
        name: "Backdoor progression",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "substitution"],
        roman: ["ii7", "bVII7", "Imaj7"],
        description: "Backdoor‑progresjonen bruker ii7–bVII7–Imaj7 i stedet for den vanlige ii–V–I. bVII7 fungerer som en dominant‑substitusjon og gir en mykere oppløsning【712155671948666†L50-L54】.",
        usageExamples: "The Beatles – In My Life, Tadd Dameron – Lady Bird, Erroll Garner – Misty【712155671948666†L50-L54】"
    },

    // Skipping duplicate or highly esoteric ones unless specifically requested as separate logic.
    // User list included "Bird changes", "Coltrane Changes", etc. Adding selected impactful ones.

    {
        id: "user_circle_prog",
        name: "Circle progression (vi–ii–V–I)",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "circle_of_fifths", "turnaround"],
        roman: ["vi7", "ii7", "V7", "Imaj7"],
        description: "Klassisk sirkelprogresjon (vi–ii–V–I) som følger kvintsirkelen og brukes i jazzturnarounds og popballader.",
        usageExamples: "Sweet Georgia Brown"
    },
    {
        id: "user_rhythm_changes",
        name: "Rhythm Changes (Variant)",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "standard", "form"],
        roman: ["Imaj7", "vi7", "ii7", "V7"], // Simplified standard turnaround part
        description: "Harmoni basert på 'I Got Rhythm'.",
        usageExamples: "Utallige bebop-låter"
    },
    {
        id: "user_pachelbel",
        name: "Pachelbels Kanon",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["classical", "baroque", "pop"],
        roman: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"],
        description: "En åtte‑akkords sekvens fra Pachelbels Canon in D: I–V–vi–iii–IV–I–IV–V. Progresjonen vandrer gjennom tonika, dominant, parallell moll, median og subdominant før den vender tilbake til tonika og dominerende. Denne harmoniske strukturen er gjenkjennelig og danner basis for mange moderne sanger【101432579954877†L63-L66】.",
        usageExamples: "Oasis – Don't Look Back in Anger, Pet Shop Boys – Go West, My Chemical Romance – Welcome to the Black Parade【101432579954877†L44-L53】"
    },
    {
        id: "user_royal_road",
        name: "Royal Road Progression",
        mode: "ionian",
        type: "seventh",
        weight: 9,
        tags: ["pop", "j-pop", "anime"],
        roman: ["IVmaj7", "V7", "iii7", "vi7"],
        description: "Vanlig i japansk pop, ofte opplevd som «bittersøt» og melodisk drivende.",
        usageExamples: "Utallige Anime-soundtracks og moderne J-Pop"
    },
    {
        id: "user_mario_cadence",
        name: "bVI–bVII–I (Mario-kadensen)",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["game", "film", "epic"],
        roman: ["bVI", "bVII", "I"],
        description: "bVI–bVII–I‑kadensen, også kjent som Mario‑kadensen, gir en triumferende, modal blandingsavslutning. Den brukes ofte i spillmusikk, spesielt i Koji Kondos Super Mario‑tema【766927516124175†L21-L50】【766927516124175†L64-L86】.",
        usageExamples: "Koji Kondo – Super Mario Bros. (nivåslutt)【766927516124175†L64-L86】"
    },
    {
        id: "user_folia",
        name: "Folía",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["classical", "baroque", "historical"],
        roman: ["i", "V", "i", "bVII", "bIII", "bVII", "i", "V"], // Shortened
        description: "Folía er en historisk mollsekvens fra barokken som følger i–V–i–bVII–bIII–bVII–i–V. Den danner grunnlaget for mange variasjonsverk og folkesanger.",
        usageExamples: "Arcangelo Corelli – La Folia"
    },
    {
        id: "user_12_bar_blues",
        name: "Twelve-bar blues (Standard)",
        mode: "mixolydian",
        type: "seventh",
        weight: 10,
        tags: ["blues", "rock", "jam"],
        roman: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"],
        description: "Standard blues-form på 12 takter.",
        usageExamples: "Chuck Berry – 'Johnny B. Goode'"
    },
    {
        id: "user_coltrane_changes",
        name: "Coltrane Changes (Giant Steps)",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["jazz", "advanced", "modulation"],
        roman: ["Imaj7", "bIII7", "bVImaj7", "bVII7", "IIImaj7", "V7", "Imaj7"], // Simplified cycle
        description: "Raske moduleringer i store terser.",
        usageExamples: "John Coltrane – 'Giant Steps'"
    },
    {
        id: "user_bird_changes",
        name: "Bird Changes (Blues for Alice)",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["jazz", "bebop", "advanced"],
        roman: ["Imaj7", "viiø7", "III7", "vi7", "ii7", "V7", "Imaj7"], // Simplified start
        description: "Kompleks blues-variant knyttet til Charlie Parker.",
        usageExamples: "Charlie Parker – 'Blues for Alice'"
    }
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all unique tags from the dataset
 */
export function getAllTags(): string[] {
    const tagsSet = new Set<string>();
    for (const prog of CHORD_PROGRESSIONS) {
        for (const tag of prog.tags) {
            tagsSet.add(tag);
        }
    }
    return [...tagsSet].sort();
}

/**
 * Filter progressions by mode and optional tags
 */
export function filterProgressions(
    mode: ModeId | "all",
    tags?: string[],
    type?: "triad" | "seventh" | "all"
): ChordProgression[] {
    return CHORD_PROGRESSIONS.filter((prog) => {
        if (mode !== "all" && prog.mode !== mode) return false;
        if (type && type !== "all" && prog.type !== type) return false;
        if (tags && tags.length > 0) {
            if (!tags.some((tag) => prog.tags.includes(tag))) return false;
        }
        return true;
    }).sort((a, b) => b.weight - a.weight);
}

/**
 * Parse a roman numeral and return info about it
 */
function parseRomanNumeral(roman: string): {
    degree: number;
    quality: string;
    accidental: string;
    extension: string;
} {
    const match = roman.match(
        /^([b#]?)([iIvV]+|[iI]{1,3}|[vV]{1,3})([°øø+]?)(maj7|7|6)?$/
    );

    if (!match) {
        // Handle special cases like secondary dominants
        if (roman.includes("/")) {
            return { degree: 0, quality: "special", accidental: "", extension: "" };
        }
        return { degree: 0, quality: "unknown", accidental: "", extension: "" };
    }

    const [, accidental = "", numeral, qualityMark = "", extension = ""] = match;

    if (!numeral) {
        return { degree: 0, quality: "unknown", accidental: "", extension: "" };
    }

    const upperNumeral = numeral.toUpperCase();
    const degreeMap: Record<string, number> = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
        V: 5,
        VI: 6,
        VII: 7,
    };

    const degree = degreeMap[upperNumeral] ?? 0;
    const isMinor = numeral === numeral.toLowerCase();

    let quality = isMinor ? "minor" : "major";
    if (qualityMark === "°") quality = "diminished";
    if (qualityMark === "ø") quality = "half-diminished";
    if (qualityMark === "+") quality = "augmented";

    return { degree, quality, accidental, extension };
}

/**
 * Check if a Roman numeral is diatonic in the given mode
 */
function isDiatonic(roman: string, mode: ModeId): boolean {
    // If it's a secondary dominant or slash chord, it's not diatonic (mostly)
    if (roman.includes("/")) return false;

    const { degree, quality, accidental } = parseRomanNumeral(roman);

    // If parsing failed
    if (degree === 0) return false;

    // 1. Check Root Accidental
    // Strict Mode-Relative: accidentals imply chromatic roots
    if (accidental !== "") return false;

    // 2. Check Quality
    const diatonicQualities = MODE_DIATONIC_7THS[mode];
    if (!diatonicQualities) return true; // Fallback

    const expected = diatonicQualities[degree - 1]; // e.g. "m7"
    if (!expected) return true;

    // Map expected 7th symbols to basic triad qualities
    const isExpectedMajor = expected.startsWith("maj") || expected === "7"; // Dominant is major triad
    const isExpectedMinor = expected.startsWith("m") && !expected.includes("b5") && !expected.includes("maj");
    const isExpectedDim = expected.includes("dim") || expected.includes("b5");

    if (quality === "major" && !isExpectedMajor) return false;
    if (quality === "minor" && !isExpectedMinor) return false;
    if ((quality === "diminished" || quality === "half-diminished") && !isExpectedDim) return false;
    if (quality === "augmented") return false; // Augmented usually non-diatonic (except Harmonic Minor IIIaug?)
    // Harmonic minor III is augMaj7. So quality "augmented" is Diatonic for Harmonic Minor III.
    if (quality === "augmented" && mode === "harmonic_minor" && degree === 3) return true;
    if (quality === "augmented") return false;

    return true;
}

/**
 * Convert a roman numeral to an actual chord symbol in a given key
 */
export function romanToChord(
    roman: string,
    tonic: string,
    mode: ModeId
): string {
    const useFlats = prefersFlats(tonic);

    // Handle secondary dominants
    if (roman.includes("/")) {
        const parts = roman.split("/");
        const targetRoman = parts[1];
        const targetParsed = parseRomanNumeral(targetRoman ?? "");

        // Get the scale to find the target note
        const scale = getScale(tonic, mode);
        let targetDegree = targetParsed.degree - 1;
        if (targetDegree < 0) targetDegree = 0;

        // const targetNote = scale.noteNames[targetDegree % 7] ?? tonic;
        // V7 of target = a major 7th chord a fifth above target
        const targetPc = scale.pcs[targetDegree % 7] ?? 0;
        const dominantPc = (targetPc + 7) % 12; // Fifth above
        const dominantNote = noteName(dominantPc, useFlats);

        return `${dominantNote}7`;
    }

    const { degree, quality, accidental, extension } = parseRomanNumeral(roman);

    if (degree === 0 || quality === "unknown" || quality === "special") {
        return roman; // Return as-is if we can't parse it
    }

    // Get scale degrees
    const scale = getScale(tonic, mode);
    const scaleDegreeIndex = degree - 1;
    let rootPc = scale.pcs[scaleDegreeIndex % 7] ?? 0;

    // Apply accidental
    if (accidental === "b") {
        rootPc = (rootPc - 1 + 12) % 12;
    } else if (accidental === "#") {
        rootPc = (rootPc + 1) % 12;
    }

    const rootNote = noteName(rootPc, useFlats);

    // Build suffix
    let suffix = "";
    switch (quality) {
        case "minor":
            suffix = extension ? (extension === "7" ? "m7" : extension === "6" ? "m6" : "m" + extension) : "m";
            break;
        case "diminished":
            suffix = extension ? "dim7" : "dim";
            break;
        case "half-diminished":
            suffix = "m7b5";
            break;
        case "augmented":
            suffix = extension ? "aug7" : "aug";
            break;
        case "major":
        default:
            suffix = extension ?? "";
            break;
    }

    return rootNote + suffix;
}

/**
 * Transpose a progression to a specific key
 */
export function transposeProgression(
    progression: ChordProgression,
    tonic: string
): TransposedProgression {
    // Determine the progression's intended mode for accurate transposition
    const actualMode = progression.mode;

    const chords = progression.roman.map((roman) =>
        romanToChord(roman, tonic, actualMode)
    );

    return {
        ...progression,
        chords,
        tonic,
    };
}

/**
 * Build a transition map from the dataset
 * Maps "chord1 -> chord2" to count of occurrences
 */
function buildTransitionMap(): Map<string, Map<string, { count: number; progressionIds: string[] }>> {
    const transitions = new Map<string, Map<string, { count: number; progressionIds: string[] }>>();

    for (const prog of CHORD_PROGRESSIONS) {
        for (let i = 0; i < prog.roman.length - 1; i++) {
            const from = prog.roman[i]!;
            const to = prog.roman[i + 1]!;

            if (!transitions.has(from)) {
                transitions.set(from, new Map());
            }

            const fromMap = transitions.get(from)!;
            if (!fromMap.has(to)) {
                fromMap.set(to, { count: 0, progressionIds: [] });
            }

            const entry = fromMap.get(to)!;
            entry.count += prog.weight; // Weight by popularity
            entry.progressionIds.push(prog.id);
        }
    }

    return transitions;
}

const transitionMap = buildTransitionMap();

/**
 * Get a secondary label explaining the chord function relative to Ionian (Major)
 * e.g. D Dorian "i" -> "ii (Rel. Ionian)"
 */
function getRelativeIonianLabel(roman: string, mode: ModeId): string | undefined {
    // Mode offsets from Ionian (in scale degrees)
    // Ionian=0, Dorian=1, Phrygian=2, Lydian=3, Mixolydian=4, Aeolian=5, Locrian=6
    const modeOffsets: Record<string, number> = {
        ionian: 0, dorian: 1, phrygian: 2, lydian: 3, mixolydian: 4, aeolian: 5, locrian: 6, harmonic_minor: 5
    };

    if (mode === "ionian") return undefined; // No relative label needed

    const offset = modeOffsets[mode] ?? 0;
    const { degree, quality, accidental, extension } = parseRomanNumeral(roman);

    if (degree === 0 || accidental !== "") return undefined; // Too complex for simple rel mapping

    const newDegree = ((degree - 1 + offset) % 7) + 1;

    // Construct new Roman
    // We keep quality, but degree changes.
    // e.g. Dorian (offset 1). "i" (deg 1 minor) -> deg 2 minor "ii".
    // "IV" (deg 4 major) -> deg 5 major "V".
    // This simple mapping works for strictly diatonic chords.

    const romanMap = ["I", "II", "III", "IV", "V", "VI", "VII"];
    let base = romanMap[newDegree - 1]!;

    if (quality === "minor" || quality === "half-diminished" || quality === "diminished") {
        base = base.toLowerCase();
    }

    let suffix = quality === "diminished" ? "°" : (quality === "half-diminished" ? "ø" : "");
    if (extension) suffix += extension;

    return `${base}${suffix} (Rel. Ionian)`;
}

/**
 * Suggest next chords based on a partial sequence
 */
export function suggestNextChords(
    partialSequence: string[],
    tonic: string,
    mode: ModeId = "ionian",
    options: { useSpice?: boolean } = {}
): NextChordSuggestion[] {
    const { useSpice = false } = options;

    if (partialSequence.length === 0) {
        return [];
    }

    // Get the last chord in the sequence
    const lastChord = partialSequence[partialSequence.length - 1]!;

    // Look up transitions from this chord
    const fromMap = transitionMap.get(lastChord);

    // Convert to array
    const suggestions: NextChordSuggestion[] = [];
    const seenRomans = new Set<string>();

    if (fromMap) {
        for (const [roman, data] of fromMap) {
            seenRomans.add(roman);
            suggestions.push({
                roman,
                chord: romanToChord(roman, tonic, mode),
                frequency: data.count,
                fromProgressions: data.progressionIds,
                isDiatonic: isDiatonic(roman, mode)
            });
        }
    }

    // Ensure Signature Chords are present even if not in transition map
    // (If the user just started or data is sparse)
    const signatures = MODAL_SIGNATURES[mode] || [];
    for (const sig of signatures) {
        if (!seenRomans.has(sig)) {
            suggestions.push({
                roman: sig,
                chord: romanToChord(sig, tonic, mode),
                frequency: 1, // Base weight
                fromProgressions: [],
                isDiatonic: isDiatonic(sig, mode)
            });
            seenRomans.add(sig);
        }
    }

    // Also ensure Tonic is present (Back to Home)
    const tonicRoman = (mode === "ionian" || mode === "lydian" || mode === "mixolydian") ? "I" : "i";
    if (!seenRomans.has(tonicRoman)) {
        suggestions.push({
            roman: tonicRoman,
            chord: romanToChord(tonicRoman, tonic, mode),
            frequency: 1,
            fromProgressions: [],
            isDiatonic: true
        });
    }

    // Filter and Weight
    const processed = suggestions.filter(s => {
        // Filter out non-diatonic if spice is OFF
        // EXCEPTION: Allow "Signature" chords even if they technically have accidentals?
        // (Our updated isDiatonic handles the renamed Mixed-VII etc).
        // If "Spice" is OFF, we hide complex stuff.
        if (!useSpice && !s.isDiatonic) return false;
        return true;
    }).map(s => {
        let score = s.frequency;

        // Boost Signature Chords
        if (signatures.includes(s.roman)) {
            score *= 2.0; // Significant boost
        }

        // Boost Tonic (Loop back)
        if (s.roman === tonicRoman) {
            score *= 1.5;
        }

        // Add Secondary Label
        const label = getRelativeIonianLabel(s.roman, mode);

        return {
            ...s,
            frequency: score,
            secondaryLabel: label
        };
    });

    // Sort by frequency
    return processed.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get common starting chords for a given mode
 */
export function getStartingChords(
    mode: ModeId | "major" | "minor",
    tonic: string,
    options: { useSpice?: boolean } = {} // Not strictly used for start yet, but good for API consistency
): NextChordSuggestion[] {
    let actualMode: ModeId = "ionian";
    if (mode === "major") actualMode = "ionian";
    else if (mode === "minor") actualMode = "aeolian";
    else actualMode = mode as ModeId;

    const starters = new Map<string, number>();

    // 1. Collect starting chords from progressions
    for (const prog of CHORD_PROGRESSIONS) {
        const progModeIsCompatible =
            prog.mode === actualMode ||
            (mode === "major" && prog.mode === "ionian") ||
            (mode === "minor" && prog.mode === "aeolian");

        if (progModeIsCompatible) {
            const first = prog.roman[0];
            if (first) {
                starters.set(first, (starters.get(first) || 0) + prog.weight);
            }
        }
    }

    // 2. Ensure Tonic and Signatures are present
    const tonicRoman = (actualMode === "ionian" || actualMode === "lydian" || actualMode === "mixolydian") ? "I" : "i";
    if (!starters.has(tonicRoman)) starters.set(tonicRoman, 10);

    const signatures = MODAL_SIGNATURES[actualMode] || [];
    for (const sig of signatures) {
        if (!starters.has(sig)) starters.set(sig, 5); // Decent weight
    }

    const { useSpice = false } = options;

    const results: NextChordSuggestion[] = [];
    for (const [roman, weight] of starters) {
        const diatonic = isDiatonic(roman, actualMode);
        if (!useSpice && !diatonic) continue;

        results.push({
            roman,
            chord: romanToChord(roman, tonic, actualMode),
            frequency: weight,
            fromProgressions: [],
            isDiatonic: diatonic,
            secondaryLabel: getRelativeIonianLabel(roman, actualMode)
        });
    }

    return results.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Find progressions that match the current user sequence.
 * A match is defined as a progression that contains a substring matching 
 * a suffix of the user's sequence.
 * 
 * @param userSequence The sequence of roman numerals built by the user
 * @param pool The pool of progressions to search in
 * @param minMatchLength Minimum length of overlap to consider a match
 */
export function findMatchingProgressions(
    userSequence: string[],
    pool: ChordProgression[],
    minMatchLength: number = 1
): ProgressionMatch[] {
    if (userSequence.length === 0) return [];

    const matches: ProgressionMatch[] = [];

    for (const prog of pool) {
        // Check suffixes of userSequence, from longest to shortest (down to minMatchLength)
        // effectively: length = userSequence.length downTo minMatchLength

        // Optimization: The match length cannot be longer than the progression itself
        const maxPossibleMatch = Math.min(userSequence.length, prog.roman.length);

        for (let len = maxPossibleMatch; len >= minMatchLength; len--) {
            const suffix = userSequence.slice(-len);

            // Check if this suffix exists in prog.roman
            // We search for the sub-array 'suffix' inside 'prog.roman'
            let foundIndex = -1;

            // Naive search for sub-array
            for (let i = 0; i <= prog.roman.length - len; i++) {
                let isMatch = true;
                for (let j = 0; j < len; j++) {
                    if (prog.roman[i + j] !== suffix[j]) {
                        isMatch = false;
                        break;
                    }
                }
                if (isMatch) {
                    foundIndex = i;
                    break;
                }
            }

            if (foundIndex !== -1) {
                matches.push({
                    progression: prog,
                    matchedIndices: Array.from({ length: len }, (_, k) => foundIndex + k),
                    matchLength: len
                });
                // Found the longest match for this progression, stop checking shorter suffixes
                break;
            }
        }
    }

    // Sort by match length (descending), then by weight (descending)
    return matches.sort((a, b) => {
        if (a.matchLength !== b.matchLength) {
            return b.matchLength - a.matchLength;
        }
        return b.progression.weight - a.progression.weight;
    });
}

