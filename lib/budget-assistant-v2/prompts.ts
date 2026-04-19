/**
 * Prompts V2 — Identité Théo + messages par étape
 * Conforme au prompt PROMPT_HERMES_ASSISTANT_BUDGET_THEO.md
 * 
 * Chaque étape a 1 à 3 bulles (messages courts).
 * Les pools de variantes sont dans variants.ts — ce fichier importe ce qu'il faut.
 * Tutoiement systématique, ton chaleureux, 1-2 émojis max par bulle.
 */

import type { ConversationStepId } from './types';

// ============================================================================
// MESSAGES PAR ÉTAPE — le script de Théo
// ============================================================================

/**
 * Structure d'un message d'étape.
 * - `messages` : 1 à 3 bulles affichées AVANT l'input
 * - `ackMessage` : message d'accusé de réception APRÈS la saisie (variante)
 * - `helpBubble` : bulle d'aide optionnelle (ex: fourchette LAMal)
 */
export interface StepMessages {
  messages: string[];
  ackFromPool?: 'ack' | 'skip' | 'transition' | 'encouragement';
  helpBubble?: string;
}

/**
 * Mapping complet : ConversationStepId → messages de Théo
 * 
 * Les messages utilisent des formulations variées.
 * Le Flow Engine combine ces messages avec les variantes
 * (ack, transition, encouragement) lors de l'exécution.
 */
export const STEP_MESSAGES: Record<ConversationStepId, StepMessages> = {
  // ─────────────────────────────────────────────
  // PHASE 1 — Accueil & cadrage
  // ─────────────────────────────────────────────
  welcome: {
    messages: [
      "Salut ! Moi c'est Théo 👋 Ton coach budget.",
      "Mon job : t'aider à voir clair dans tes finances en posant les bonnes questions, étape par étape.",
      "On va construire ensemble un budget basé sur la règle des 50/30/20 : 50 % pour tes besoins essentiels, 30 % pour tes envies, 20 % pour l'épargne.\nC'est une boussole, pas une règle stricte.",
      "Compte 10 à 15 minutes. On y va ?",
    ],
  },

  welcome_confirm: {
    messages: [
      "C'est parti ! 🚀",
    ],
    ackFromPool: 'ack',
  },

  // ─────────────────────────────────────────────
  // PHASE 2 — Revenus
  // ─────────────────────────────────────────────
  revenus_intro: {
    messages: [
      "Première étape : tes revenus. 💰\nC'est la base de tout — avant de répartir, il faut savoir ce qui rentre.",
    ],
  },

  revenus_salaire: {
    messages: [
      "On commence par l'essentiel : ton salaire.\nQuel est ton revenu mensuel net ? (après déductions, ce qui arrive vraiment sur ton compte)",
    ],
    helpBubble: "Si tu as des frais professionnels déduits, donne-moi le montant après tout.",
  },

  revenus_treizieme: {
    messages: [
      "Question rapide : tu touches un 13e salaire ?",
    ],
  },

  revenus_treizieme_montant: {
    messages: [
      "Super. Combien touche-tu pour ce 13e ?",
    ],
    helpBubble: "Je diviserai par 12 pour l'intégrer à ton budget mensuel.",
  },

  revenus_autres: {
    messages: [
      "Mis à part ton salaire, as-tu d'autres revenus réguliers chaque mois ?",
    ],
  },

  revenus_autres_sources: {
    messages: [
      "Lesquels ? Sélectionne tout ce qui s'applique 👇",
    ],
  },

  revenus_autres_montant: {
    messages: [
      "Combien par mois pour {source} ?",
    ],
  },

  revenus_recap: {
    messages: [
      "Voilà pour tes revenus !",
    ],
  },

  // ─────────────────────────────────────────────
  // PHASE 3 — Dépenses fixes
  // ─────────────────────────────────────────────
  depenses_fixes_intro: {
    messages: [
      "Maintenant le plus important : on va lister précisément tout ce qui te coûte chaque mois pour vivre. 🏠",
      "C'est ça qui détermine ton vrai « 50 % ». Je te guide poste par poste — si un poste ne te concerne pas, clique simplement « Pas concerné ».",
    ],
  },

  // --- A. Logement ---
  logement_loyer: {
    messages: [
      "On attaque par la base : ton logement. 💪\nCombien paies-tu de loyer ou de mensualité hypothèque par mois ?",
    ],
    helpBubble: "Si coloc, indique juste TA part.",
  },

  logement_charges: {
    messages: [
      "Et les charges ? (eau, entretien, ascenseur…)\nSi elles sont comprises dans ton loyer, pas la peine de les séparer.",
    ],
  },

  logement_electricite: {
    messages: [
      "L'électricité maintenant. ⚡\nDonne-moi ta moyenne mensuelle — même si tu paies trimestriellement.",
    ],
    helpBubble: "En Suisse, c'est souvent entre 60 et 150 CHF/mois selon la taille du logement.",
  },

  logement_chauffage: {
    messages: [
      "Le chauffage ? Si c'est compris dans tes charges, on zappe.",
    ],
    helpBubble: "Moyenne suisse : 100-250 CHF/mois selon l'isolation et le type de chauffage.",
  },

  logement_internet: {
    messages: [
      "Internet / Box à la maison ? 📡",
    ],
    helpBubble: "Init7, Swisscom, Sunrise, Salt… compteur 40-100 CHF/mois en général.",
  },

  logement_serafe: {
    messages: [
      "La redevance radio/TV (SERAFE). 📻\nC'est 335 CHF par an, soit 28 CHF/mois. Tu peux utiliser ce montant.",
    ],
    helpBubble: "Tu peux te faire exempter si tu ne captes aucune chaîne radio/TV — demande sur serafe.ch.",
  },

  // --- B. Assurances ---
  assurances_intro: {
    messages: [
      "Passons aux assurances — en Suisse, c'est un poste qui pèse ! 🛡️",
    ],
  },

  assurances_lamal: {
    messages: [
      "LAMal (assurance maladie de base) — impossible d'y couper.\nCombien paies-tu par mois ?",
    ],
    helpBubble: "Prime moyenne : 300 à 500 CHF/mois selon canton et franchise. Vérifie sur bonus.ch si tu peux trouver moins cher.",
  },

  assurances_complementaire: {
    messages: [
      "As-tu une complémentaire santé ? (chambre privée, médecine douce, lunettes…)",
    ],
  },

  assurances_menage_rc: {
    messages: [
      "Assurance ménage ou RC privée ? Souvent groupées ensemble.",
    ],
    helpBubble: "RC privée = ~100-150 CHF/an. Ménage = varie selon superficie.",
  },

  assurances_vehicule: {
    messages: [
      "Combien paies-tu d'assurance voiture par mois ?",
    ],
  },

  // --- C. Transport ---
  transport_voiture: {
    messages: [
      "On passe aux transports. ✈️… ben non, plutôt 🚗\nAs-tu une voiture ?",
    ],
  },

  transport_essence: {
    messages: [
      "Combien dépenses-tu en essence par mois en moyenne ?",
    ],
    helpBubble: "Si tu as une voiture électrique, mets tes coûts de recharge ici.",
  },

  transport_entretien: {
    messages: [
      "Et l'entretien du véhicule ? (pneus, service, nettoyage…)\nSi tu raisonnes à l'année, divise par 12.",
    ],
  },

  transport_parking: {
    messages: [
      "Frais de parking ? (à domicile, au travail, ou les deux)",
    ],
  },

  transport_leasing: {
    messages: [
      "Tu as un leasing ou crédit auto en cours ?",
    ],
  },

  transport_publics: {
    messages: [
      "Et les transports publics ? AG, demi-tarif, abo mensuel CFF… 🚂",
    ],
    helpBubble: "Demi-tarif : ~190 CHF/an (16 CHF/mois). AG zones : varie selon ville.",
  },

  // --- D. Télécom ---
  telecom_mobile: {
    messages: [
      "Ton forfait mobile ? 📱\nDonne-moi le montant mensuel.",
    ],
    helpBubble: "En Suisse : 25-80 CHF/mois selon le forfait (Wingo/Muvon = moins cher, Swisscom = plus cher).",
  },

  // --- E. Impôts ---
  impots_acomptes: {
    messages: [
      "Les impôts maintenant. 🏛️\nComment paies-tu tes impôts ?",
    ],
  },

  // --- F. Engagements fixes ---
  engagements_credits: {
    messages: [
      "Dernier bloc de dépenses fixes ! 💪\nAs-tu des crédits ou leasing en cours (hors voiture) ?",
    ],
    helpBubble: "Prêt personnel, achat à tempérament, leasing matériel…",
  },

  engagements_pension: {
    messages: [
      "Pension alimentaire ou contribution familiale régulière ?",
    ],
  },

  engagements_abonnements: {
    messages: [
      "Les abonnements récurrents ! 🎵 Sélectionne ceux que tu as :",
    ],
  },

  engagements_abonnements_montant: {
    messages: [
      "Combien pour {aboName} par mois ?",
    ],
  },

  depenses_fixes_recap: {
    messages: [
      "Et voilà ton socle mensuel ! Tu viens de lister tout ce qui est incompressible.",
    ],
  },

  // ─────────────────────────────────────────────
  // PHASE 4 — Dépenses variables / envies
  // ─────────────────────────────────────────────
  variables_intro: {
    messages: [
      "OK, on passe à la partie plus flexible : tes dépenses du quotidien et tes envies. 🎉",
      "C'est moins précis, on est sur des estimations mensuelles. Je te propose des fourchettes pour te donner un repère.",
    ],
  },

  variables_alimentaire: {
    messages: [
      "Les courses alimentaires d'abord. 🛒\nEn moyenne, combien par mois ?",
    ],
  },

  variables_restaurants: {
    messages: [
      "Restaurants, livraisons, cafés… ? ☕\nCe genre de dépenses s'accumule vite !",
    ],
  },

  variables_sorties: {
    messages: [
      "Sorties, loisirs : cinéma, concerts, bars… 🎬\nCombien par mois environ ?",
    ],
  },

  variables_vetements: {
    messages: [
      "Vêtements et shopping ? 👔\nLissé sur l'année, ça donne quoi par mois ?",
    ],
  },

  variables_voyages: {
    messages: [
      "Voyages et weekends ! ✈️\nPense à lisser sur 12 mois (ex : 1 voyage à 1'200 CHF/an = 100 CHF/mois).",
    ],
  },

  variables_cadeaux: {
    messages: [
      "Cadeaux, anniversaires, occasions spéciales ? 🎁\nLà aussi, lisse sur l'année.",
    ],
  },

  variables_autres: {
    messages: [
      "Autres envies pas encore couvertes ? (sport hors abo, cosmétiques, hobbies, jeux…)",
    ],
  },

  variables_recap: {
    messages: [
      "Voilà pour tes envies !",
    ],
  },

  // ─────────────────────────────────────────────
  // PHASE 5 — Épargne
  // ─────────────────────────────────────────────
  epargne_intro: {
    messages: [
      "Dernier bloc avant le récap : l'épargne. 💎\nC'est ce qui transforme un budget en outil de liberté.",
    ],
  },

  epargne_montant_actuel: {
    messages: [
      "Combien épargnes-tu actuellement chaque mois en moyenne ?\nPas de jugement, je veux juste le chiffre réel.",
    ],
  },

  epargne_objectif_oui_non: {
    messages: [
      "As-tu un objectif d'épargne précis ?\nUn projet qui te motive à mettre de côté.",
    ],
  },

  epargne_objectif_montant: {
    messages: [
      "D'accord ! De combien as-tu besoin au total pour ce projet ?",
    ],
  },

  epargne_objectif_echeance: {
    messages: [
      "Dans combien de temps ?",
    ],
  },

  epargne_objectif_nature: {
    messages: [
      "C'est pour quel type de projet ?",
    ],
  },

  epargne_suggestion_oui_non: {
    messages: [
      "Pas de projet fixe, c'est OK ! 🤷\nVeux-tu que je te suggère un objectif basé sur ta capacité actuelle ?",
    ],
  },

  epargne_automatisation: {
    messages: [
      "💡 Petit conseil : programme un virement automatique en début de mois.\nL'épargne devient une « dépense » prioritaire et tu n'y penses plus.",
    ],
  },

  // ─────────────────────────────────────────────
  // PHASE 6 — Récap & plan d'action
  // ─────────────────────────────────────────────
  recap_intro: {
    messages: [
      "Et voilà, on a fait le tour ! 🎉\nMaintenant, regardons le résultat.",
    ],
  },

  recap_carte_finale: {
    messages: [
      "Voici ton budget mensuel :",
    ],
  },

  recap_diagnostic: {
    messages: [
      "Voici mon analyse de tes ratios :",
    ],
  },

  recap_plan_action: {
    messages: [
      "Pour progresser, choisis les actions qui te parlent le plus 👇\nTu peux en sélectionner plusieurs.",
    ],
  },

  recap_conseils_action: {
    messages: [
      "Voici un conseil concret pour chaque action choisie 👇",
    ],
  },

  recap_fin: {
    messages: [
      "Bravo, ton budget est bouclé ! 🎉\nTu peux le retrouver et le modifier depuis ton espace.",
    ],
  },
};

// ============================================================================
// DIAGNOSTIC — messages personnalisés selon les ratios
// ============================================================================

export interface DiagnosticMessages {
  equilibre: string[];
  besoins_elevés: string[];
  envies_elevees: string[];
  epargne_faible: string[];
  capacite_negative: string[];
}

export const DIAGNOSTIC_MESSAGES: DiagnosticMessages = {
  equilibre: [
    "Bravo, ton budget est équilibré ! 🎯\nMaintenant l'enjeu c'est la régularité — tiens-le sur 3 mois et tu verras la différence.",
  ],
  besoins_elevés: [
    "Ton socle est lourd. On peut creuser :\n• LAMal → changer de caisse peut économiser 50-150 CHF/mois\n• Forfait mobile → Wingo, Muvon ou Yallo = 25-35 CHF\n• Abonnements oubliés → vérifie tes prélèvements",
  ],
  envies_elevees: [
    "Tes envies prennent une belle place — c'est OK si c'est conscient.\nUne piste : fixer un budget hebdo loisirs (ex : 50 CHF/semaine = ~200/mois) pour garder le contrôle sans te priver.",
  ],
  epargne_faible: [
    "Priorité n°1 : remonter à 10 % minimum.\nLe levier le plus simple = ajuster les envies, pas le socle.\nMême 50 CHF de plus par mois, c'est 600 CHF/an de gagnés !",
  ],
  capacite_negative: [
    "⚠️ Tes dépenses dépassent tes revenus.\nPas de panique — on va devoir alléger. Les premiers leviers :\n• Reserrer les envies\n• Vérifier les abonnements inutilisés\n• Comparer tes assurances\nOn va trouver des marges ensemble.",
  ],
};

// ============================================================================
// PLANS D'ACTION — mini-conseils concrets par action
// ============================================================================

export type PlanActionConseilKey =
  | 'reduire_depenses_fixes'
  | 'mieux_suivre_envies'
  | 'automatiser_epargne'
  | 'definir_objectif_epargne'
  | 'refaire_budget_1_mois';

export const PLAN_ACTION_CONSEILS: Record<PlanActionConseilKey, string> = {
  reduire_depenses_fixes: "🎯 Commence par le plus simple : compare ta prime LAMal sur bonus.ch. Ensuite, regarde ton forfait mobile — les discounters (Wingo, Muvon) coûtent 2 à 3 fois moins cher que Swisscom.",

  mieux_suivre_envies: "🎯 Fixe-toi un plafond hebdomadaire pour les loisirs (ex : 50 CHF/semaine). Utilise une app de suivi ou un simple note dans ton téléphone. Le simple fait de suivre change les comportements.",

  automatiser_epargne: "🎯 Règle un virement automatique en début de mois : le jour où tu reçois ton salaire, 10 % partent sur un compte épargne. Tu ne verras même plus cet argent — et c'est exactement le but.",

  definir_objectif_epargne: "🎯 Un objectif concret motive 10x plus. Définis un montant + une date (ex : 3'000 CHF pour Noël). Découpe en étapes : 3'000 ÷ 8 mois = 375 CHF/mois — ça paraît soudainement faisable.",

  refaire_budget_1_mois: "🎯 Refais ce bilan dans 30 jours. Tes dépenses réelles d'un mois te donneront une photo plus précise. J'enverrai un petit rappel si tu veux !",
};

// ============================================================================
// LABELS DES BOUTONS — centralisés pour cohérence
// ============================================================================

export const BUTTON_LABELS = {
  // Général
  cestParti: "C'est parti 🚀",
  plusTard: "Plus tard",
  oui: "Oui",
  non: "Non",
  aucun: "Aucun",
  pasConcerne: "Pas concerné",
  jenAiPas: "Je n'en ai pas",
  pasDeVehicule: "Pas de véhicule",
  pasDeLeasing: "Pas de leasing",
  comprisesDansLoyer: "Comprises dans le loyer",
  comprisDansLesCharges: "Compris dans les charges",
  prelevesSource: "Prélevés à la source",
  provisionMoiMeme: "Je provisionne moi-même",
  acomptesMensuels: "Je paie des acomptes",
  utiliser28Chf: "Utiliser 28 CHF",
  autreMontant: "Autre montant",
  rienPourLinstant: "Rien pour l'instant",
  pasEncore: "Pas encore",
  sauvegarderBudget: "Sauvegarder mon budget",
  recommencer: "Recommencer",

  // Sources de revenus
  allocationsFamiliales: "Allocations familiales",
  rente: "Rente",
  revenusLocatifs: "Revenus locatifs",
  freelance: "Freelance / 2e activité",
  autreSource: "Autre",

  // Sans revenu salarial
  sansRevenuSalarial: "Je suis sans revenu salarial",

  // Abonnements (multi-select)
  spotifyAppleMusic: "Spotify / Apple Music",
  netflixDisney: "Netflix / Disney+ / etc.",
  salleSport: "Salle de sport",
  cloudIcloud: "Cloud / iCloud / Google",
  presseJournaux: "Presse / journaux",
  autreAbo: "Autre abo",

  // Objectif épargne
  objectifOui: "Oui, un projet précis",

  // Nature objectif
  achatImmobilier: "Achat immobilier",
  voyage: "Voyage",
  voiture: "Voiture",
  mariage: "Mariage",
  reserveSecurite: "Réserve de sécurité",
  retraite3ePilier: "Retraite / 3e pilier",
  autreProjet: "Autre projet",

  // Échéance
  sixMois: "6 mois",
  unAn: "1 an",
  deuxAns: "2 ans",
  cinqAns: "5 ans",
  dixAnsPlus: "10+ ans",

  // Plan d'action (multi-select)
  reduireDepensesFixes: "Réduire mes dépenses fixes",
  mieuxSuivreEnvies: "Mieux suivre mes envies",
  automatiserEpargne: "Automatiser mon épargne",
  definirObjectifEpargne: "Définir un objectif d'épargne",
  refaireBudget1Mois: "Refaire mon budget dans 1 mois",
} as const;

// ============================================================================
// LABELS DES CATEGORIES (pour affichage dans les cartes récap)
// ============================================================================

export const CATEGORY_LABELS: Record<string, string> = {
  // Logement
  loyer: "Loyer / Hypothèque",
  charges: "Charges",
  electricite: "Électricité",
  chauffage: "Chauffage",
  internet: "Internet / Box",
  serafe: "SERAFE",

  // Assurances
  lamal: "LAMal",
  complementaire: "Complémentaire santé",
  menageRc: "Ménage / RC",
  vehicule: "Assurance véhicule",

  // Transport
  essence: "Essence",
  entretien: "Entretien voiture",
  parking: "Parking",
  leasing: "Leasing voiture",
  transportsPublics: "Transports publics",
  mobile: "Forfait mobile",

  // Impôts
  impots: "Impôts",

  // Engagements
  credits: "Crédits / Leasing",
  pension: "Pension alimentaire",
  abonnements: "Abonnements",

  // Variables
  alimentaire: "Courses alimentaires",
  restaurants: "Restaurants / Cafés",
  sorties: "Sorties / Loisirs",
  vetements: "Vêtements / Shopping",
  voyages: "Voyages / Weekends",
  cadeaux: "Cadeaux / Occasions",
  autres: "Autres envies",
};

// ============================================================================
// INTROS DE PHASE — variantes (pour ne pas répéter le même intro)
// ============================================================================

export const PHASE_INTRO_VARIANTS: Record<number, string[]> = {
  1: [
    "Salut ! Moi c'est Théo 👋 Ton coach budget.",
    "Bienvenue ! Je suis Théo, ton coach budget. 👋",
    "Hey ! Théo ici, prêt à t'aider avec ton budget. 👋",
  ],
  2: [
    "Première étape : tes revenus. 💰\nC'est la base de tout — avant de répartir, il faut savoir ce qui rentre.",
    "On commence par les rentrées d'argent. 💰\nC'est le point de départ de tout bon budget.",
    "Cap sur tes revenus ! 💰\nAvant de répartir, voyons ce qui entre chaque mois.",
  ],
  3: [
    "Maintenant le plus important : on va lister tout ce qui te coûte chaque mois. 🏠",
    "Place aux dépenses fixes ! On va les passer au peigne fin. 🔍",
    "C'est parti pour le bloc le plus important : tes besoins essentiels. 💪",
  ],
  4: [
    "OK, on passe à la partie flexible : tes envies et dépenses du quotidien. 🎉",
    "Enchaînons avec tes dépenses variables — celles où tu as le plus de marge. 🎉",
    "Direction les envies ! C'est ici que tu as le plus de flexibilité. ✨",
  ],
  5: [
    "Dernier bloc avant le récap : l'épargne. 💎",
    "On termine par le plus important pour ton avenir : l'épargne. 💎",
    "Presque fini ! Parlons épargne — ça transforme un budget en outil de liberté. 💎",
  ],
  6: [
    "Et voilà, on a fait le tour ! 🎉 Regardons le résultat.",
    "Le moment de vérité ! On récapitule tout. 🎉",
    "On y est ! Le récap de ton budget. 🎉",
  ],
};

// ============================================================================
// RATIO FEEDBACK — messages contextuels selon le ratio dépenses fixes / revenus
// ============================================================================

export const RATIO_MESSAGES = {
  fixes: {
    excellent: "Excellent, tu as une vraie marge ! 🎯",
    sain: "Pile dans la zone saine 👍",
    eleve: "Ton socle est élevé, on regardera comment alléger.",
    critique: "Ton socle prend une grosse part. Pas de jugement, on va trouver des leviers ensemble.",
  },
  variables: {
    sous: "Tes envies sont sous contrôle — c'est un atout !",
    ok: "Tes envies sont dans la moyenne, c'est bien dosé.",
    auDessus: "Tes envies prennent une belle part. Si c'est conscient, c'est OK !",
  },
  epargne: {
    superieur: "Tu épargnes plus que les 20 % recommandés — chapeau ! 🏆",
    objectif: "Tu touches les 20 % idéaux. C'est l'objectif à tenir !",
    correct: "Tu es entre 10 et 20 % — bien ! Continue à monter.",
    faible: "Tu es en dessous de 10 %. Priorité : remonter doucement, même +50 CHF/mois compte.",
    zero: "0 % d'épargne, c'est le signal pour agir. On va trouver comment dégager de la marge.",
  },
} as const;

// ============================================================================
// UTILS — formatage des montants suisses
// ============================================================================

/**
 * Formate un nombre en format monétaire suisse : 1'450 CHF
 */
export const formatCHF = (amount: number): string => {
  const formatted = amount
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${formatted} CHF`;
};

/**
 * Calcule un pourcentage et le formatte : "49 %"
 */
export const formatPercent = (value: number, total: number): string => {
  if (total === 0) return "0 %";
  return `${Math.round((value / total) * 100)} %`;
};

/**
 * Remplace les placeholders dans les messages :
 * - {source} → nom de la source de revenu
 * - {aboName} → nom de l'abonnement
 * - {category} → nom de catégorie
 * - {amount} → montant formaté CHF
 * - {percent} → pourcentage formaté
 */
export const fillTemplate = (
  template: string,
  vars: Record<string, string>
): string => {
  return Object.entries(vars).reduce(
    (msg, [key, val]) => msg.replace(new RegExp(`\\{${key}\\}`, 'g'), val),
    template
  );
};