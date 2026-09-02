'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'es';

const STORAGE_KEY = 'sw_lang';

export interface Translations {
  toggle: {
    ariaLabel: string;
  };
  home: {
    tagline: string;
    hostGame: string;
    joinGame: string;
    howItWorks: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    fullRules: string;
    moreGames: string;
  };
  create: {
    pageTitle: string;
    yourName: string;
    namePlaceholder: string;
    howManyPlaying: string;
    howManyWolves: string;
    maxWolves: (cap: number, players: number) => string;
    discussionTimer: string;
    custom: string;
    secondsPlaceholder: string;
    adjustSettings: string;
    creating: string;
    createGame: string;
    timerLabels: Record<number, string>;
  };
  join: {
    pageTitle: string;
    gameCode: string;
    yourName: string;
    namePlaceholder: string;
    enterCode: string;
    joining: string;
    joinGame: string;
  };
  avatarPicker: {
    title: string;
    skip: string;
    tapToChoose: string;
    saving: string;
    choose: string;
    prev: string;
    next: string;
  };
  game: {
    connecting: string;
    redirecting: string;
    reconnecting: string;
    gameEndedTitle: string;
    gameEndedBody: string;
    backToHome: string;
    round: (n: number) => string;
    spectating: string;
    playersRemaining: (n: number) => string;
    revealVoteRecord: string;
    ringRevealed: string;
    ringAlive: string;
    endGame: string;
    endGameConfirm: string;
  };
  playerList: {
    host: string;
    you: string;
    voted: string;
    wolf: string;
    sheep: string;
  };
  roleCard: {
    ariaYourRole: string;
    ariaTapToReveal: string;
    yourRole: string;
    tapToReveal: string;
    youAreAWolf: string;
    youAreASheep: string;
    wolfBody: string;
    sheepBody: string;
    seenRole: string;
    waitingOthers: string;
    otherWolves: string;
    wolfTag: string;
  };
  lobby: {
    yourGameCode: string;
    shareCode: string;
    playersJoined: string;
    startGame: string;
    waitingForMore: (n: number) => string;
    endGame: string;
    endGameConfirm: string;
    waitingHostStart: string;
  };
  voice: {
    join: string;
    connecting: string;
    live: string;
    muted: string;
    mute: string;
    unmute: string;
    leave: string;
    audioBlocked: string;
  };
  roleReveal: {
    assigningRoles: string;
    haveRevealed: string;
  };
  questionCard: {
    gameOnBadge: string;
    holderTitle: string;
    pickPrompt: string;
    askThis: string;
    readAloud: string;
    someoneFallback: string;
    someoneHasCard: (name: string) => string;
    theyWillRead: string;
  };
  discussion: {
    label: string;
    question: string;
    paused: string;
    playersRemaining: (n: number, round: number) => string;
    readyToVote: string;
    readyChecked: string;
    readyCount: (ready: number, needed: number) => string;
    tapToCancel: string;
    skipsTimer: string;
    resumeTimer: string;
    pauseTimer: string;
  };
  voting: {
    votingUnderway: string;
    eliminatedSpectating: (submitted: number, needed: number) => string;
    voteSubmitted: string;
    waitingOthers: (submitted: number, needed: number) => string;
    tieVoteAgain: string;
    timeToVote: string;
    whoSuspect: string;
    submitVote: string;
  };
  voteReveal: {
    votesAreIn: string;
    eliminatedSuffix: string;
  };
  tiebreaker: {
    title: string;
    subtitle: string;
  };
  elimination: {
    was: (name: string) => string;
    wasAWolf: (name: string) => string;
    wasASheep: (name: string) => string;
  };
  gameOver: {
    sheepWin: string;
    wolvesWin: string;
    summary: (rounds: number, players: number, wolves: number) => string;
    wolfLabel: string;
    sheepLabel: string;
    eliminatedRound: (r: number) => string;
    survived: string;
    // Keyed by the fixed English reason strings the server returns.
    reasons: Record<string, string>;
  };
  voteRecordModal: {
    title: string;
    round: (r: number, tiebreaker: boolean) => string;
    onceNotice: string;
    close: string;
  };
  howToPlay: {
    metaTitle: string;
    title: string;
    subtitle: string;
    setupHeading: string;
    setup1Title: string;
    setup1Body: string;
    setup2Title: string;
    setup2Body: string;
    setup3Title: string;
    setup3Body: string;
    roundHeading: string;
    round4Title: string;
    round4Body: string;
    round5Title: string;
    round5Body: string;
    round6Title: string;
    round6Body: string;
    round7Title: string;
    round7Body: string;
    round8Title: string;
    round8Body: string;
    faqHeading: string;
    faqs: { question: string; answer: string }[];
    hostGame: string;
    moreGames: string;
    backToHome: string;
  };
  partyGameIdeas: {
    metaTitle: string;
    title: string;
    subtitle: string;
    startHereHeading: string;
    intro: string;
    hostGame: string;
    howToPlay: string;
    moreGamesHeading: string;
    moreGamesIntro: string;
    backToHome: string;
    games: { name: string; blurb: string }[];
  };
  footer: {
    howToPlay: string;
    privacy: string;
  };
  privacy: {
    title: string;
    updatedLabel: string;
    date: string;
    intro: string;
    sections: { heading: string; paragraphs: string[] }[];
    resourcesHeading: string;
    livekitLink: string;
    googlePrivacyLink: string;
    adSettingsLink: string;
    backToHome: string;
  };
}

const en: Translations = {
  toggle: { ariaLabel: 'Switch language' },
  home: {
    tagline:
      "A real-time social deduction party game. Gather your group, grab your phones, and find the wolves before it's too late.",
    hostGame: 'Host a Game',
    joinGame: 'Join a Game',
    howItWorks: 'How it works',
    step1Title: '1. Host sets up the round.',
    step1Body: 'Pick a player count, wolf count, and discussion timer, then share the code or QR.',
    step2Title: '2. Everyone gets a secret role.',
    step2Body: 'Most players are sheep; a hidden few are wolves.',
    step3Title: '3. Discuss, then vote.',
    step3Body: 'Talk it out in person, then vote out who you think is a wolf before they outnumber the sheep.',
    fullRules: 'Full rules & FAQ',
    moreGames: 'More games for game night',
  },
  create: {
    pageTitle: 'Host a Game',
    yourName: 'Your Name',
    namePlaceholder: 'Leave blank for a random name',
    howManyPlaying: 'How many people are playing?',
    howManyWolves: 'How many wolves?',
    maxWolves: (cap, players) => `Max ${cap} wolves for ${players} players`,
    discussionTimer: 'Discussion Timer',
    custom: 'Custom',
    secondsPlaceholder: 'Seconds',
    adjustSettings: 'Adjust your settings above before creating the game.',
    creating: 'Creating…',
    createGame: 'Create Game',
    timerLabels: { 60: '1 min', 120: '2 min', 180: '3 min', 300: '5 min', 420: '7 min', 600: '10 min' },
  },
  join: {
    pageTitle: 'Join a Game',
    gameCode: 'Game Code',
    yourName: 'Your Name',
    namePlaceholder: 'Leave blank for a random name',
    enterCode: 'Enter a game code.',
    joining: 'Joining…',
    joinGame: 'Join Game',
  },
  avatarPicker: {
    title: 'How are you feeling?',
    skip: 'skip',
    tapToChoose: 'Tap to choose',
    saving: 'Saving…',
    choose: 'Choose this sheep',
    prev: 'Previous sheep',
    next: 'Next sheep',
  },
  game: {
    connecting: 'Connecting…',
    redirecting: 'Redirecting…',
    reconnecting: 'Reconnecting…',
    gameEndedTitle: 'Game Ended',
    gameEndedBody: 'The host has ended this game.',
    backToHome: 'Back to Home',
    round: (n) => `ROUND ${n}`,
    spectating: 'Spectating',
    playersRemaining: (n) => `${n} Players Remaining`,
    revealVoteRecord: 'Reveal Vote Record (only you see this)',
    ringRevealed: 'ready',
    ringAlive: 'left',
    endGame: 'End Game',
    endGameConfirm: 'End this game for everyone?',
  },
  playerList: {
    host: 'Host',
    you: '(you)',
    voted: 'Voted',
    wolf: '🐺 WOLF',
    sheep: '🐑 SHEEP',
  },
  roleCard: {
    ariaYourRole: 'Your role',
    ariaTapToReveal: 'Tap to reveal your role',
    yourRole: 'Your Role',
    tapToReveal: 'Tap to reveal',
    youAreAWolf: 'YOU ARE A WOLF',
    youAreASheep: 'YOU ARE A SHEEP',
    wolfBody: 'Stay hidden and survive until the wolves outnumber the sheep.',
    sheepBody: 'Find and vote out all of the wolves.',
    seenRole: "I've Seen My Role",
    waitingOthers: 'Waiting for the other players…',
    otherWolves: 'The other wolves',
    wolfTag: 'Wolf',
  },
  lobby: {
    yourGameCode: 'Your Game Code',
    shareCode: 'Share this code with everyone playing, or have them scan the QR code.',
    playersJoined: 'Players Joined',
    startGame: 'Start Game',
    waitingForMore: (n) => `Waiting for ${n} more player${n === 1 ? '' : 's'}…`,
    endGame: 'End Game',
    endGameConfirm: 'End this game for everyone?',
    waitingHostStart: 'Waiting for the host to start the game…',
  },
  voice: {
    join: 'Join Voice Chat',
    connecting: 'Connecting…',
    live: 'Voice chat live',
    muted: 'Muted',
    mute: 'Mute',
    unmute: 'Unmute',
    leave: 'Leave',
    audioBlocked: 'Tap to enable audio',
  },
  roleReveal: {
    assigningRoles: 'Assigning roles…',
    haveRevealed: 'players have revealed their roles',
  },
  questionCard: {
    gameOnBadge: 'Game on — talk freely while you wait',
    holderTitle: 'You have the question card',
    pickPrompt: 'Pick the question you want to ask the group.',
    askThis: 'Ask this question',
    readAloud: "Read it out loud once everyone's ready — the timer starts the moment you pick it.",
    someoneFallback: 'Someone',
    someoneHasCard: (name) => `${name} has the question card`,
    theyWillRead: "They'll read it out loud when your group is ready.",
  },
  discussion: {
    label: 'Discussion',
    question: 'Question',
    paused: 'PAUSED',
    playersRemaining: (n, round) => `${n} player${n === 1 ? '' : 's'} remaining · Round ${round}`,
    readyToVote: 'Ready to vote',
    readyChecked: 'Ready to vote',
    readyCount: (ready, needed) => `${ready}/${needed} ready`,
    tapToCancel: ' — tap to cancel',
    skipsTimer: ' · skips the timer once everyone is',
    resumeTimer: 'Resume timer',
    pauseTimer: 'Pause timer',
  },
  voting: {
    votingUnderway: 'Voting is underway',
    eliminatedSpectating: (submitted, needed) =>
      `You've been eliminated and are now spectating. ${submitted}/${needed} votes submitted.`,
    voteSubmitted: 'Vote submitted',
    waitingOthers: (submitted, needed) => `Waiting for the other players… (${submitted}/${needed})`,
    tieVoteAgain: "IT'S A TIE — VOTE AGAIN",
    timeToVote: 'TIME TO VOTE',
    whoSuspect: 'Who do you suspect?',
    submitVote: 'Submit Vote',
  },
  voteReveal: {
    votesAreIn: 'THE VOTES ARE IN',
    eliminatedSuffix: ' has been eliminated.',
  },
  tiebreaker: {
    title: "IT'S A TIE",
    subtitle: 'These players will go to a re-vote:',
  },
  elimination: {
    was: (name) => `${name} was...`,
    wasAWolf: (name) => `${name?.toUpperCase()} WAS A WOLF`,
    wasASheep: (name) => `${name?.toUpperCase()} WAS A SHEEP`,
  },
  gameOver: {
    sheepWin: 'THE SHEEP WIN!',
    wolvesWin: 'THE WOLVES WIN!',
    summary: (rounds, players, wolves) =>
      `${rounds} Round${rounds === 1 ? '' : 's'} · ${players} Players · ${wolves} Wolves`,
    wolfLabel: '🐺 Wolf',
    sheepLabel: '🐑 Sheep',
    eliminatedRound: (r) => `· Eliminated R${r}`,
    survived: '· Survived',
    reasons: {
      'All of the wolves have been eliminated.': 'All of the wolves have been eliminated.',
      "It's down to one sheep and one wolf -- the wolf wins the standoff.":
        "It's down to one sheep and one wolf -- the wolf wins the standoff.",
      'The wolves now outnumber the sheep.': 'The wolves now outnumber the sheep.',
    },
  },
  voteRecordModal: {
    title: 'Vote Record',
    round: (r, tiebreaker) => `Round ${r}${tiebreaker ? ' · Tiebreaker' : ''}`,
    onceNotice: 'This record can only be viewed once. It will be hidden again once you close it.',
    close: 'Close · Hide Vote Record',
  },
  howToPlay: {
    metaTitle: 'How to Play',
    title: 'How to Play Sheep & Wolves',
    subtitle: "A free real-time social deduction party game for 3–30 players. Here's everything you need to run a round.",
    setupHeading: 'Setup',
    setup1Title: '1. Host creates the game.',
    setup1Body:
      'The host picks how many people are playing (3–30), how many are wolves, and how long the discussion timer runs, then shares the game code or QR code with the group.',
    setup2Title: '2. Everyone joins from their phone.',
    setup2Body: "Players scan the QR code or enter the game code and a name — no app download or account needed.",
    setup3Title: '3. Roles are dealt secretly.',
    setup3Body:
      "Most players are dealt sheep and a hidden few are dealt wolves. Only you can see your own role — but once a wolf taps to reveal their card, their screen also shows the names of the other wolves so the pack knows who's on their team.",
    roundHeading: 'Playing a round',
    round4Title: '4. Pick a question.',
    round4Body:
      'One player is dealt three discussion prompts, picks the one they want to ask the group, and reads it aloud — that starts the timer.',
    round5Title: '5. Discuss out loud.',
    round5Body:
      "Talk it out as a group in person until the timer runs out. Wolves try to blend in; sheep try to spot who's lying.",
    round6Title: '6. Vote.',
    round6Body:
      'Everyone votes for who they suspect is a wolf. The player with the most votes is eliminated and their role is revealed. Ties go to a quick tiebreaker vote.',
    round7Title: '7. The question-asker checks the record.',
    round7Body:
      "Only the player who drew this round's question card gets a private, one-time look at who voted for whom. Nobody else sees it — so it's up to them whether to report it honestly.",
    round8Title: '8. Repeat until someone wins.',
    round8Body: 'Sheep win once every wolf is voted out. Wolves win if they ever equal or outnumber the remaining sheep.',
    faqHeading: 'Frequently asked questions',
    faqs: [
      {
        question: 'What is Sheep & Wolves?',
        answer:
          "Sheep & Wolves is a free, real-time social deduction party game played on everyone's phones. Most players are secretly sheep and a hidden few are wolves. The group discusses out loud and votes each round to eliminate a suspected wolf, trying to find every wolf before the wolves outnumber the sheep.",
      },
      {
        question: 'How many players do I need?',
        answer:
          'You need at least 3 players, and up to 30 can join a single game. The host picks the player count and the number of wolves when setting up the game — the app automatically caps the wolf count so sheep always start in the majority.',
      },
      {
        question: 'Do players need to download an app?',
        answer:
          "No. Sheep & Wolves runs entirely in the browser. The host creates a game and shares a short code or QR code, and everyone else joins from their own phone's browser — nothing to install.",
      },
      {
        question: 'Do we need to be in the same room?',
        answer:
          "Sheep & Wolves is designed to be played in person. Everyone uses their own phone to see their secret role and vote, but the discussion happens out loud, face to face, which is what makes reading the room — and catching the wolves — possible.",
      },
      {
        question: 'How does a round work?',
        answer:
          "Each round, one player is dealt three question cards, picks the one they want to ask (things like \"who's being unusually quiet?\"), and reads it aloud. That starts the discussion timer, which the host sets when creating the game. When time is up, everyone votes for who they think is a wolf, and the player with the most votes is eliminated and their role is revealed.",
      },
      {
        question: 'Do the wolves know who each other are?',
        answer:
          "Yes. As soon as a wolf taps to reveal their role card, their screen also shows the names of the other wolves, each on a matching mini wolf card. Sheep never see this — their card just shows that they're a sheep.",
      },
      {
        question: 'Can players see who voted for whom?',
        answer:
          "Only one player each round can: whoever drew that round's question card. After the vote they get a single private look at the full record of who voted for whom. Nobody else can see it, and they don't have to share what they saw — or share it truthfully — so the record is as much a bluffing tool as an information one.",
      },
      {
        question: 'What happens if a vote ties?',
        answer:
          'If two or more players tie for the most votes, those tied players go to a quick tiebreaker vote among the rest of the group instead of eliminating no one.',
      },
      {
        question: 'How do sheep win? How do wolves win?',
        answer:
          "Sheep win once every wolf has been voted out. Wolves win if they ever equal or outnumber the remaining sheep — so the sheep need to find every wolf before that happens. If the game ever comes down to one sheep and one wolf, the wolf wins that final standoff automatically.",
      },
      {
        question: 'Is Sheep & Wolves like Werewolf or Mafia?',
        answer:
          "Yes — Sheep & Wolves is a phone-based take on classic hidden-role social deduction games like Werewolf and Mafia. Instead of a moderator managing roles and votes on paper, everyone's phone handles roles, timers, and voting automatically, so any group can pick up and play with no experience needed.",
      },
      {
        question: 'Is Sheep & Wolves free to play?',
        answer: 'Yes, Sheep & Wolves is completely free to host and join, with no account or app download required.',
      },
    ],
    hostGame: 'Host a Game',
    moreGames: 'More Games for Game Night',
    backToHome: 'Back to Home',
  },
  partyGameIdeas: {
    metaTitle: 'Party Games for Game Night',
    title: 'Party Games for Game Night',
    subtitle: 'A running list of our favorite free games for game night — good for large groups, no downloads required.',
    startHereHeading: 'Start here',
    intro: 'A free real-time social deduction game for 3–30 players. Everyone plays from their own phone — no app download needed.',
    hostGame: 'Host a Game',
    howToPlay: 'How to Play',
    moreGamesHeading: 'More games to try',
    moreGamesIntro: "Other free, browser-based games we've played and liked for group game nights.",
    backToHome: 'Back to Home',
    games: [
      {
        name: 'The Imposter',
        blurb: 'A quick social deduction game — everyone gets a word except the imposter, who has to bluff their way through.',
      },
      {
        name: 'Gartic Phone',
        blurb: "A drawing-and-guessing game with a telephone twist — watch prompts hilariously mutate as they pass around the group.",
      },
      {
        name: 'Skribbl.io',
        blurb: 'The classic browser drawing-and-guessing game — simple, fast rounds that work for almost any group size.',
      },
      {
        name: 'Draw Battle',
        blurb: "Imagine Skribbl.io but team-based — draw and guess against another team instead of everyone for themselves.",
      },
      {
        name: 'Spyfall',
        blurb: "Everyone knows the secret location except the spy, who has to guess it before getting caught — great with a big group.",
      },
      {
        name: 'Songlio',
        blurb: 'A fast-paced music guessing game — great for a group with strong opinions about their playlists.',
      },
      {
        name: 'Jigsaw Explorer',
        blurb: 'Online jigsaw puzzles you can solve together — doing one with a big group turns into chaotic, surprisingly fun teamwork.',
      },
      {
        name: 'GeoGuessr',
        blurb: 'Drop into a random Street View location and guess where in the world you are — plays great solo or as a group.',
      },
    ],
  },
  footer: {
    howToPlay: 'How to Play',
    privacy: 'Privacy',
  },
  privacy: {
    title: 'Privacy Policy',
    updatedLabel: 'Last updated',
    date: 'September 2, 2026',
    intro:
      'Sheep & Wolves is a free, browser-based party game. You do not create an account, and we do not ask for your email address, phone number, or any other identifier. This page explains the limited information the game does handle, why, and how long it is kept.',
    sections: [
      {
        heading: '1. Information collected automatically',
        paragraphs: [
          'When you host (create) a game, our server records the IP address and browser user-agent string of that request. We use this only to protect the service — investigating abuse, spam, and automated game creation, and enforcing rate limits.',
          'Joining a game as a player does not record your IP address. Our hosting providers may keep short-lived operational request logs of their own, as is standard for any website.',
        ],
      },
      {
        heading: '2. Information you provide',
        paragraphs: [
          "The display name you enter (or a random one we generate if you leave it blank) is shown to the other players in your game and stored with that game's data. It is not linked to any account or to you as an individual. Names are cleaned of hidden and control characters and screened against a short list of slurs before being stored.",
        ],
      },
      {
        heading: '3. Storage on your device',
        paragraphs: [
          "Your game session is kept in your browser's sessionStorage so a refresh doesn't remove you from the game; it is scoped to that browser tab and cleared when the tab closes. Your language and background-music preferences are kept in localStorage on your device. Neither is sent anywhere beyond what is needed to run the game.",
        ],
      },
      {
        heading: '4. Voice chat (optional)',
        paragraphs: [
          'If you choose to join voice chat, your audio is carried in real time through LiveKit, our voice infrastructure provider (see Resources below). The conversation is not recorded or stored by us.',
        ],
      },
      {
        heading: '5. Analytics and advertising',
        paragraphs: [
          "On the public site we use Google Analytics to understand aggregate usage and Google AdSense to show ads. These services may set cookies or similar identifiers and collect device and usage data under Google's policies (see Resources below). You can manage ad personalization through Google Ad Settings.",
        ],
      },
      {
        heading: '6. How we use information',
        paragraphs: [
          'To run games and keep players connected; to prevent abuse, spam, and automated misuse; to understand how the game is used in aggregate; and to display ads that keep the game free.',
        ],
      },
      {
        heading: '7. Sharing',
        paragraphs: [
          'We do not sell your information. We share it only with the infrastructure providers that run the service on our behalf — Supabase (database and game API hosting), AWS Amplify (web hosting), LiveKit (voice), and Google (analytics and ads) — and where we are legally required to.',
        ],
      },
      {
        heading: '8. Retention',
        paragraphs: [
          'Game records, including the host IP address and user-agent, are kept no longer than needed for the security and abuse-prevention purposes above, and are deleted on a rolling basis once a game is over. On-device storage (section 3) stays until you clear it or your browser does.',
        ],
      },
      {
        heading: '9. Your choices',
        paragraphs: [
          "If you would rather your IP address not be recorded, join a game someone else hosts instead of hosting one yourself. You can clear this site's on-device storage at any time through your browser settings, and control cookies and ad personalization through your browser and the Google links below.",
        ],
      },
      {
        heading: '10. Children',
        paragraphs: [
          'Sheep & Wolves is not directed at children under 13, and we do not knowingly collect information from them. If you believe a child has provided information to us, contact us and we will remove it.',
        ],
      },
      {
        heading: '11. Changes to this policy',
        paragraphs: [
          'If this policy changes, we will update the date at the top of this page. Continued use of the game after a change means you accept the updated policy.',
        ],
      },
      {
        heading: '12. Contact',
        paragraphs: ['Questions about this policy or your information: privacy@sheepandwolves.app'],
      },
    ],
    resourcesHeading: 'Resources',
    livekitLink: 'LiveKit privacy policy',
    googlePrivacyLink: 'Google Privacy Policy',
    adSettingsLink: 'Google Ad Settings',
    backToHome: 'Back to Home',
  },
};

const es: Translations = {
  toggle: { ariaLabel: 'Cambiar idioma' },
  home: {
    tagline:
      'Un juego de fiesta de deducción social en tiempo real. Reúne a tu grupo, agarren sus teléfonos y encuentren a los lobos antes de que sea demasiado tarde.',
    hostGame: 'Crear una Partida',
    joinGame: 'Unirse a una Partida',
    howItWorks: 'Cómo funciona',
    step1Title: '1. El anfitrión configura la ronda.',
    step1Body: 'Elige el número de jugadores, de lobos y el temporizador de discusión, luego comparte el código o el QR.',
    step2Title: '2. Todos reciben un rol secreto.',
    step2Body: 'La mayoría de los jugadores son ovejas; unos pocos ocultos son lobos.',
    step3Title: '3. Discutan y luego voten.',
    step3Body: 'Hablen en persona y luego voten para eliminar a quien crean que es un lobo antes de que superen en número a las ovejas.',
    fullRules: 'Reglas completas y preguntas frecuentes',
    moreGames: 'Más juegos para la noche de juegos',
  },
  create: {
    pageTitle: 'Crear una Partida',
    yourName: 'Tu Nombre',
    namePlaceholder: 'Déjalo en blanco para un nombre aleatorio',
    howManyPlaying: '¿Cuántas personas van a jugar?',
    howManyWolves: '¿Cuántos lobos?',
    maxWolves: (cap, players) => `Máximo ${cap} lobos para ${players} jugadores`,
    discussionTimer: 'Temporizador de Discusión',
    custom: 'Personalizado',
    secondsPlaceholder: 'Segundos',
    adjustSettings: 'Ajusta la configuración de arriba antes de crear la partida.',
    creating: 'Creando…',
    createGame: 'Crear Partida',
    timerLabels: { 60: '1 min', 120: '2 min', 180: '3 min', 300: '5 min', 420: '7 min', 600: '10 min' },
  },
  join: {
    pageTitle: 'Unirse a una Partida',
    gameCode: 'Código de Partida',
    yourName: 'Tu Nombre',
    namePlaceholder: 'Déjalo en blanco para un nombre aleatorio',
    enterCode: 'Ingresa un código de partida.',
    joining: 'Uniéndose…',
    joinGame: 'Unirse a la Partida',
  },
  avatarPicker: {
    title: '¿Cómo te sientes?',
    skip: 'omitir',
    tapToChoose: 'Toca para elegir',
    saving: 'Guardando…',
    choose: 'Elegir esta oveja',
    prev: 'Oveja anterior',
    next: 'Oveja siguiente',
  },
  game: {
    connecting: 'Conectando…',
    redirecting: 'Redirigiendo…',
    reconnecting: 'Reconectando…',
    gameEndedTitle: 'Partida Finalizada',
    gameEndedBody: 'El anfitrión ha terminado esta partida.',
    backToHome: 'Volver al Inicio',
    round: (n) => `RONDA ${n}`,
    spectating: 'Observando',
    playersRemaining: (n) => `${n} Jugadores Restantes`,
    revealVoteRecord: 'Revelar Registro de Votos (solo tú lo ves)',
    ringRevealed: 'listos',
    ringAlive: 'quedan',
    endGame: 'Terminar Partida',
    endGameConfirm: '¿Terminar esta partida para todos?',
  },
  playerList: {
    host: 'Anfitrión',
    you: '(tú)',
    voted: 'Votó',
    wolf: '🐺 LOBO',
    sheep: '🐑 OVEJA',
  },
  roleCard: {
    ariaYourRole: 'Tu rol',
    ariaTapToReveal: 'Toca para revelar tu rol',
    yourRole: 'Tu Rol',
    tapToReveal: 'Toca para revelar',
    youAreAWolf: 'ERES UN LOBO',
    youAreASheep: 'ERES UNA OVEJA',
    wolfBody: 'Mantente oculto y sobrevive hasta que los lobos superen en número a las ovejas.',
    sheepBody: 'Encuentra y vota para eliminar a todos los lobos.',
    seenRole: 'Ya Vi Mi Rol',
    waitingOthers: 'Esperando a los demás jugadores…',
    otherWolves: 'Los otros lobos',
    wolfTag: 'Lobo',
  },
  lobby: {
    yourGameCode: 'Tu Código de Partida',
    shareCode: 'Comparte este código con todos los jugadores, o pídeles que escaneen el código QR.',
    playersJoined: 'Jugadores Unidos',
    startGame: 'Comenzar Partida',
    waitingForMore: (n) => `Esperando a ${n} jugador${n === 1 ? '' : 'es'} más…`,
    endGame: 'Terminar Partida',
    endGameConfirm: '¿Terminar esta partida para todos?',
    waitingHostStart: 'Esperando a que el anfitrión comience la partida…',
  },
  voice: {
    join: 'Unirse al Chat de Voz',
    connecting: 'Conectando…',
    live: 'Chat de voz activo',
    muted: 'Silenciado',
    mute: 'Silenciar',
    unmute: 'Activar Micrófono',
    leave: 'Salir',
    audioBlocked: 'Toca para activar el audio',
  },
  roleReveal: {
    assigningRoles: 'Asignando roles…',
    haveRevealed: 'jugadores han revelado su rol',
  },
  questionCard: {
    gameOnBadge: 'El juego ya empezó — hablen libremente mientras esperan',
    holderTitle: 'Tienes la carta de pregunta',
    pickPrompt: 'Elige la pregunta que quieres hacerle al grupo.',
    askThis: 'Hacer esta pregunta',
    readAloud: 'Léela en voz alta cuando todos estén listos — el temporizador comienza en cuanto la elijas.',
    someoneFallback: 'Alguien',
    someoneHasCard: (name) => `${name} tiene la carta de pregunta`,
    theyWillRead: 'La leerá en voz alta cuando tu grupo esté listo.',
  },
  discussion: {
    label: 'Discusión',
    question: 'Pregunta',
    paused: 'PAUSADO',
    playersRemaining: (n, round) => `${n} jugador${n === 1 ? '' : 'es'} restante${n === 1 ? '' : 's'} · Ronda ${round}`,
    readyToVote: 'Listo para votar',
    readyChecked: 'Listo para votar',
    readyCount: (ready, needed) => `${ready}/${needed} listos`,
    tapToCancel: ' — toca para cancelar',
    skipsTimer: ' · salta el temporizador cuando todos lo estén',
    resumeTimer: 'Reanudar temporizador',
    pauseTimer: 'Pausar temporizador',
  },
  voting: {
    votingUnderway: 'La votación está en curso',
    eliminatedSpectating: (submitted, needed) =>
      `Has sido eliminado y ahora estás observando. ${submitted}/${needed} votos enviados.`,
    voteSubmitted: 'Voto enviado',
    waitingOthers: (submitted, needed) => `Esperando a los demás jugadores… (${submitted}/${needed})`,
    tieVoteAgain: 'HAY UN EMPATE — VOTEN DE NUEVO',
    timeToVote: 'HORA DE VOTAR',
    whoSuspect: '¿De quién sospechas?',
    submitVote: 'Enviar Voto',
  },
  voteReveal: {
    votesAreIn: 'LOS VOTOS ESTÁN LISTOS',
    eliminatedSuffix: ' ha sido eliminado.',
  },
  tiebreaker: {
    title: 'HAY UN EMPATE',
    subtitle: 'Estos jugadores irán a una votación de desempate:',
  },
  elimination: {
    was: (name) => `${name} era...`,
    wasAWolf: (name) => `${name?.toUpperCase()} ERA UN LOBO`,
    wasASheep: (name) => `${name?.toUpperCase()} ERA UNA OVEJA`,
  },
  gameOver: {
    sheepWin: '¡LAS OVEJAS GANAN!',
    wolvesWin: '¡LOS LOBOS GANAN!',
    summary: (rounds, players, wolves) =>
      `${rounds} Ronda${rounds === 1 ? '' : 's'} · ${players} Jugadores · ${wolves} Lobos`,
    wolfLabel: '🐺 Lobo',
    sheepLabel: '🐑 Oveja',
    eliminatedRound: (r) => `· Eliminado R${r}`,
    survived: '· Sobrevivió',
    reasons: {
      'All of the wolves have been eliminated.': 'Todos los lobos han sido eliminados.',
      "It's down to one sheep and one wolf -- the wolf wins the standoff.":
        'Quedan una oveja y un lobo — el lobo gana el enfrentamiento final.',
      'The wolves now outnumber the sheep.': 'Los lobos ahora superan en número a las ovejas.',
    },
  },
  voteRecordModal: {
    title: 'Registro de Votos',
    round: (r, tiebreaker) => `Ronda ${r}${tiebreaker ? ' · Desempate' : ''}`,
    onceNotice: 'Este registro solo se puede ver una vez. Se ocultará de nuevo al cerrarlo.',
    close: 'Cerrar · Ocultar Registro de Votos',
  },
  howToPlay: {
    metaTitle: 'Cómo Jugar',
    title: 'Cómo Jugar Sheep & Wolves',
    subtitle:
      'Un juego de fiesta de deducción social gratuito y en tiempo real para 3 a 30 jugadores. Aquí está todo lo que necesitas para jugar una ronda.',
    setupHeading: 'Configuración',
    setup1Title: '1. El anfitrión crea la partida.',
    setup1Body:
      'El anfitrión elige cuántas personas van a jugar (3–30), cuántos son lobos y cuánto dura el temporizador de discusión, luego comparte el código o el código QR con el grupo.',
    setup2Title: '2. Todos se unen desde su teléfono.',
    setup2Body: 'Los jugadores escanean el código QR o ingresan el código de partida y un nombre — no se necesita descargar ninguna app ni crear una cuenta.',
    setup3Title: '3. Los roles se reparten en secreto.',
    setup3Body:
      'La mayoría de los jugadores reciben el rol de oveja y unos pocos ocultos reciben el de lobo. Solo tú puedes ver tu propio rol — pero en cuanto un lobo toca para revelar su carta, su pantalla también muestra los nombres de los otros lobos para que la manada sepa quiénes están en su equipo.',
    roundHeading: 'Jugando una ronda',
    round4Title: '4. Elige una pregunta.',
    round4Body:
      'Un jugador recibe tres preguntas de discusión, elige la que quiere hacerle al grupo y la lee en voz alta — eso inicia el temporizador.',
    round5Title: '5. Discutan en voz alta.',
    round5Body:
      'Hablen como grupo en persona hasta que se acabe el tiempo. Los lobos intentan pasar desapercibidos; las ovejas intentan detectar quién miente.',
    round6Title: '6. Voten.',
    round6Body:
      'Todos votan por a quién sospechan que es un lobo. El jugador con más votos es eliminado y se revela su rol. Los empates van a una votación rápida de desempate.',
    round7Title: '7. Quien hizo la pregunta revisa el registro.',
    round7Body:
      'Solo el jugador que sacó la carta de pregunta de esta ronda obtiene una mirada privada, de una sola vez, a quién votó por quién. Nadie más lo ve — así que depende de esa persona si lo cuenta con honestidad.',
    round8Title: '8. Repitan hasta que alguien gane.',
    round8Body: 'Las ovejas ganan cuando todos los lobos han sido votados fuera. Los lobos ganan si alguna vez igualan o superan en número a las ovejas restantes.',
    faqHeading: 'Preguntas frecuentes',
    faqs: [
      {
        question: '¿Qué es Sheep & Wolves?',
        answer:
          'Sheep & Wolves es un juego de fiesta de deducción social gratuito y en tiempo real que se juega en los teléfonos de todos. La mayoría de los jugadores son ovejas en secreto y unos pocos ocultos son lobos. El grupo discute en voz alta y vota cada ronda para eliminar a un sospechoso de ser lobo, tratando de encontrar a todos los lobos antes de que superen en número a las ovejas.',
      },
      {
        question: '¿Cuántos jugadores necesito?',
        answer:
          'Necesitas al menos 3 jugadores, y hasta 30 pueden unirse a una sola partida. El anfitrión elige el número de jugadores y de lobos al configurar la partida — la app limita automáticamente el número de lobos para que las ovejas siempre empiecen en mayoría.',
      },
      {
        question: '¿Los jugadores necesitan descargar una app?',
        answer:
          'No. Sheep & Wolves funciona completamente en el navegador. El anfitrión crea una partida y comparte un código corto o un código QR, y todos los demás se unen desde el navegador de su propio teléfono — no hay nada que instalar.',
      },
      {
        question: '¿Necesitamos estar en la misma sala?',
        answer:
          'Sheep & Wolves está diseñado para jugarse en persona. Cada quien usa su propio teléfono para ver su rol secreto y votar, pero la discusión ocurre en voz alta, cara a cara, que es lo que hace posible leer el ambiente — y atrapar a los lobos.',
      },
      {
        question: '¿Cómo funciona una ronda?',
        answer:
          'En cada ronda, un jugador recibe tres cartas de pregunta, elige la que quiere hacer (cosas como "¿quién está inusualmente callado?") y la lee en voz alta. Eso inicia el temporizador de discusión, que el anfitrión configura al crear la partida. Cuando se acaba el tiempo, todos votan por quién creen que es un lobo, y el jugador con más votos es eliminado y se revela su rol.',
      },
      {
        question: '¿Los lobos saben quiénes son los demás lobos?',
        answer:
          'Sí. En cuanto un lobo toca para revelar su carta de rol, su pantalla también muestra los nombres de los otros lobos, cada uno en una mini carta de lobo a juego. Las ovejas nunca ven esto — su carta solo muestra que son una oveja.',
      },
      {
        question: '¿Los jugadores pueden ver quién votó por quién?',
        answer:
          'Solo uno por ronda puede: quien sacó la carta de pregunta de esa ronda. Después de la votación obtiene una única mirada privada al registro completo de quién votó por quién. Nadie más puede verlo, y no está obligado a compartir lo que vio — ni a compartirlo con honestidad — así que el registro es tanto una herramienta de engaño como de información.',
      },
      {
        question: '¿Qué pasa si hay un empate en la votación?',
        answer:
          'Si dos o más jugadores empatan con más votos, esos jugadores empatados van a una votación rápida de desempate entre el resto del grupo en lugar de no eliminar a nadie.',
      },
      {
        question: '¿Cómo ganan las ovejas? ¿Cómo ganan los lobos?',
        answer:
          'Las ovejas ganan cuando todos los lobos han sido votados fuera. Los lobos ganan si alguna vez igualan o superan en número a las ovejas restantes — así que las ovejas necesitan encontrar a todos los lobos antes de que eso pase. Si el juego llega a una oveja y un lobo, el lobo gana automáticamente ese enfrentamiento final.',
      },
      {
        question: '¿Sheep & Wolves es como Werewolf o Mafia?',
        answer:
          'Sí — Sheep & Wolves es una versión para teléfono de los clásicos juegos de deducción social con roles ocultos como Werewolf y Mafia. En lugar de un moderador que maneja roles y votos en papel, el teléfono de cada quien se encarga de los roles, temporizadores y votaciones automáticamente, así que cualquier grupo puede empezar a jugar sin experiencia previa.',
      },
      {
        question: '¿Sheep & Wolves es gratis?',
        answer: 'Sí, Sheep & Wolves es completamente gratis para crear y unirse, sin necesidad de cuenta ni de descargar ninguna app.',
      },
    ],
    hostGame: 'Crear una Partida',
    moreGames: 'Más Juegos para la Noche de Juegos',
    backToHome: 'Volver al Inicio',
  },
  partyGameIdeas: {
    metaTitle: 'Juegos de Fiesta para la Noche de Juegos',
    title: 'Juegos de Fiesta para la Noche de Juegos',
    subtitle: 'Una lista de nuestros juegos gratuitos favoritos para la noche de juegos — buenos para grupos grandes, sin descargas necesarias.',
    startHereHeading: 'Empieza aquí',
    intro: 'Un juego de deducción social gratuito y en tiempo real para 3 a 30 jugadores. Todos juegan desde su propio teléfono — no se necesita ninguna app.',
    hostGame: 'Crear una Partida',
    howToPlay: 'Cómo Jugar',
    moreGamesHeading: 'Más juegos para probar',
    moreGamesIntro: 'Otros juegos gratuitos basados en navegador que hemos jugado y nos gustaron para noches de juegos en grupo.',
    backToHome: 'Volver al Inicio',
    games: [
      {
        name: 'The Imposter',
        blurb: 'Un juego rápido de deducción social — todos reciben una palabra excepto el impostor, que tiene que mentir para salir adelante.',
      },
      {
        name: 'Gartic Phone',
        blurb: 'Un juego de dibujar y adivinar con un giro de teléfono descompuesto — mira cómo las frases mutan hilarantemente al pasar por el grupo.',
      },
      {
        name: 'Skribbl.io',
        blurb: 'El clásico juego de navegador de dibujar y adivinar — rondas simples y rápidas que funcionan para casi cualquier tamaño de grupo.',
      },
      {
        name: 'Draw Battle',
        blurb: 'Imagina Skribbl.io pero por equipos — dibuja y adivina contra otro equipo en lugar de todos contra todos.',
      },
      {
        name: 'Spyfall',
        blurb: 'Todos conocen el lugar secreto excepto el espía, que tiene que adivinarlo antes de ser descubierto — excelente con un grupo grande.',
      },
      {
        name: 'Songlio',
        blurb: 'Un juego rápido de adivinar canciones — genial para un grupo con opiniones fuertes sobre sus listas de reproducción.',
      },
      {
        name: 'Jigsaw Explorer',
        blurb: 'Rompecabezas en línea que puedes resolver en equipo — hacer uno con un grupo grande se convierte en un trabajo en equipo caótico y sorprendentemente divertido.',
      },
      {
        name: 'GeoGuessr',
        blurb: 'Cae en una ubicación aleatoria de Street View y adivina en qué parte del mundo estás — se juega genial solo o en grupo.',
      },
    ],
  },
  footer: {
    howToPlay: 'Cómo Jugar',
    privacy: 'Privacidad',
  },
  privacy: {
    title: 'Política de Privacidad',
    updatedLabel: 'Última actualización',
    date: '2 de septiembre de 2026',
    intro:
      'Sheep & Wolves es un juego de fiesta gratuito que funciona en el navegador. No creas ninguna cuenta y no te pedimos tu correo electrónico, número de teléfono ni ningún otro identificador. Esta página explica la información limitada que el juego sí maneja, por qué y durante cuánto tiempo se conserva.',
    sections: [
      {
        heading: '1. Información recopilada automáticamente',
        paragraphs: [
          'Cuando organizas (creas) una partida, nuestro servidor registra la dirección IP y la cadena de user-agent del navegador de esa solicitud. Usamos esto únicamente para proteger el servicio: investigar abusos, spam y la creación automatizada de partidas, y aplicar límites de uso.',
          'Unirse a una partida como jugador no registra tu dirección IP. Nuestros proveedores de alojamiento pueden mantener sus propios registros operativos de solicitudes de corta duración, como es habitual en cualquier sitio web.',
        ],
      },
      {
        heading: '2. Información que proporcionas',
        paragraphs: [
          'El nombre que escribes (o uno aleatorio que generamos si lo dejas en blanco) se muestra a los demás jugadores de tu partida y se guarda con los datos de esa partida. No está vinculado a ninguna cuenta ni a ti como individuo. Los nombres se limpian de caracteres ocultos y de control y se comprueban contra una lista breve de insultos antes de guardarse.',
        ],
      },
      {
        heading: '3. Almacenamiento en tu dispositivo',
        paragraphs: [
          'Tu sesión de juego se guarda en el sessionStorage de tu navegador para que una recarga no te saque de la partida; está limitada a esa pestaña del navegador y se borra al cerrarla. Tus preferencias de idioma y de música de fondo se guardan en el localStorage de tu dispositivo. Ninguno de los dos se envía a ningún sitio más allá de lo necesario para que el juego funcione.',
        ],
      },
      {
        heading: '4. Chat de voz (opcional)',
        paragraphs: [
          'Si eliges unirte al chat de voz, tu audio se transmite en tiempo real a través de LiveKit, nuestro proveedor de infraestructura de voz (consulta Recursos más abajo). Nosotros no grabamos ni almacenamos la conversación.',
        ],
      },
      {
        heading: '5. Analítica y publicidad',
        paragraphs: [
          'En el sitio público usamos Google Analytics para entender el uso agregado y Google AdSense para mostrar anuncios. Estos servicios pueden establecer cookies o identificadores similares y recopilar datos de dispositivo y de uso según las políticas de Google (consulta Recursos más abajo). Puedes gestionar la personalización de anuncios desde la Configuración de anuncios de Google.',
        ],
      },
      {
        heading: '6. Cómo usamos la información',
        paragraphs: [
          'Para ejecutar las partidas y mantener conectados a los jugadores; para prevenir abusos, spam y uso automatizado indebido; para entender de forma agregada cómo se usa el juego; y para mostrar anuncios que mantienen el juego gratuito.',
        ],
      },
      {
        heading: '7. Con quién compartimos',
        paragraphs: [
          'No vendemos tu información. Solo la compartimos con los proveedores de infraestructura que operan el servicio en nuestro nombre — Supabase (base de datos y alojamiento de la API del juego), AWS Amplify (alojamiento web), LiveKit (voz) y Google (analítica y anuncios) — y cuando la ley nos obliga a ello.',
        ],
      },
      {
        heading: '8. Conservación',
        paragraphs: [
          'Los registros de las partidas, incluida la dirección IP y el user-agent del anfitrión, se conservan solo el tiempo necesario para los fines de seguridad y prevención de abusos indicados arriba, y se eliminan de forma periódica una vez que termina la partida. El almacenamiento en el dispositivo (sección 3) permanece hasta que lo borres tú o tu navegador.',
        ],
      },
      {
        heading: '9. Tus opciones',
        paragraphs: [
          'Si prefieres que no se registre tu dirección IP, únete a una partida organizada por otra persona en lugar de organizar una tú. Puedes borrar el almacenamiento de este sitio en tu dispositivo en cualquier momento desde la configuración de tu navegador, y controlar las cookies y la personalización de anuncios desde tu navegador y los enlaces de Google de abajo.',
        ],
      },
      {
        heading: '10. Menores',
        paragraphs: [
          'Sheep & Wolves no está dirigido a menores de 13 años y no recopilamos información de ellos a sabiendas. Si crees que un menor nos ha proporcionado información, contáctanos y la eliminaremos.',
        ],
      },
      {
        heading: '11. Cambios en esta política',
        paragraphs: [
          'Si esta política cambia, actualizaremos la fecha en la parte superior de esta página. Seguir usando el juego después de un cambio implica que aceptas la política actualizada.',
        ],
      },
      {
        heading: '12. Contacto',
        paragraphs: ['Preguntas sobre esta política o tu información: privacy@sheepandwolves.app'],
      },
    ],
    resourcesHeading: 'Recursos',
    livekitLink: 'Política de privacidad de LiveKit',
    googlePrivacyLink: 'Política de Privacidad de Google',
    adSettingsLink: 'Configuración de anuncios de Google',
    backToHome: 'Volver al Inicio',
  },
};

const dictionaries: Record<Lang, Translations> = { en, es };

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      setLangState(stored);
    } else if (navigator.language?.toLowerCase().startsWith('es')) {
      setLangState('es');
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next = current === 'en' ? 'es' : 'en';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, t: dictionaries[lang] }),
    [lang, setLang, toggleLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
