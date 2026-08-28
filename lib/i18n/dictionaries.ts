export type Locale = "en" | "he";

export interface Dictionary {
  appName: string;
  tagline: string;
  nav: {
    play: string;
    leaderboard: string;
    profile: string;
    login: string;
    signup: string;
    logout: string;
  };
  home: {
    heading: string;
    subheading: string;
    playLocal: string;
    playPass: string;
    createRoom: string;
    joinRoom: string;
  };
  game: {
    roll: string;
    yourTurn: string;
    opponentTurn: string;
    white: string;
    black: string;
    winner: string;
    gammon: string;
    backgammon: string;
    newGame: string;
    newGameConfirm: string;
    confirm: string;
    cancel: string;
    bar: string;
    off: string;
    roomCode: string;
    copyLink: string;
    chatPlaceholder: string;
    send: string;
    history: string;
    noHistory: string;
    stats: string;
    pipCount: string;
    borneOff: string;
    hits: string;
    turns: string;
    time: string;
    difficulty: string;
    easy: string;
    medium: string;
    hard: string;
    start: string;
    rematch: string;
    backToMenu: string;
  };
  auth: {
    email: string;
    password: string;
    username: string;
    loginTitle: string;
    signupTitle: string;
    submit: string;
    needsSupabase: string;
  };
  leaderboard: {
    title: string;
    rank: string;
    player: string;
    rating: string;
    wins: string;
    losses: string;
    empty: string;
  };
  profile: {
    title: string;
    stats: string;
  };
  theme: {
    light: string;
    dark: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    appName: "Backgammon",
    tagline: "Play backgammon online with real rules — free and open source",
    nav: {
      play: "Play",
      leaderboard: "Leaderboard",
      profile: "Profile",
      login: "Log in",
      signup: "Sign up",
      logout: "Log out",
    },
    home: {
      heading: "Play backgammon, the real way",
      subheading:
        "Local pass-and-play, a heuristic AI opponent, or real-time online matches in private rooms.",
      playLocal: "Play vs AI",
      playPass: "Pass and play",
      createRoom: "Create online room",
      joinRoom: "Join with code",
    },
    game: {
      roll: "Roll dice",
      yourTurn: "Your turn",
      opponentTurn: "Opponent's turn",
      white: "White",
      black: "Black",
      winner: "{player} wins!",
      gammon: "Gammon!",
      backgammon: "Backgammon!",
      newGame: "New game",
      newGameConfirm: "Start a new game? Current progress will be lost.",
      confirm: "Confirm",
      cancel: "Cancel",
      bar: "Bar",
      off: "Borne off",
      roomCode: "Room code",
      copyLink: "Copy invite link",
      chatPlaceholder: "Say something...",
      send: "Send",
      history: "Move history",
      noHistory: "No moves yet",
      stats: "Stats",
      pipCount: "Pip count",
      borneOff: "Borne off",
      hits: "Hits",
      turns: "Turns",
      time: "Time",
      difficulty: "Difficulty",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      start: "Start game",
      rematch: "Rematch",
      backToMenu: "Back to menu",
    },
    auth: {
      email: "Email",
      password: "Password",
      username: "Username",
      loginTitle: "Log in",
      signupTitle: "Create an account",
      submit: "Submit",
      needsSupabase:
        "Online accounts require a configured Supabase project. See the README for setup instructions.",
    },
    leaderboard: {
      title: "Leaderboard",
      rank: "Rank",
      player: "Player",
      rating: "Rating",
      wins: "Wins",
      losses: "Losses",
      empty: "No ranked players yet — connect Supabase to enable the leaderboard.",
    },
    profile: {
      title: "Profile",
      stats: "Stats",
    },
    theme: {
      light: "Light",
      dark: "Dark",
    },
  },
  he: {
    appName: "שש-בש",
    tagline: "שחקו שש-בש אונליין עם חוקים אמיתיים — חינם וקוד פתוח",
    nav: {
      play: "שחק",
      leaderboard: "טבלת דירוג",
      profile: "פרופיל",
      login: "התחברות",
      signup: "הרשמה",
      logout: "התנתקות",
    },
    home: {
      heading: "שחקו שש-בש, בצורה האמיתית",
      subheading: "משחק מקומי, יריב מחשב, או משחקים אונליין בזמן אמת בחדרים פרטיים.",
      playLocal: "שחק נגד המחשב",
      playPass: "משחק מקומי (שני שחקנים)",
      createRoom: "צור חדר אונליין",
      joinRoom: "הצטרף עם קוד",
    },
    game: {
      roll: "הטל קוביות",
      yourTurn: "התור שלך",
      opponentTurn: "התור של היריב",
      white: "לבן",
      black: "שחור",
      winner: "{player} ניצח!",
      gammon: "גאמון!",
      backgammon: "בקגאמון!",
      newGame: "משחק חדש",
      newGameConfirm: "להתחיל משחק חדש? ההתקדמות הנוכחית תאבד.",
      confirm: "אישור",
      cancel: "ביטול",
      bar: "בר",
      off: "יצאו מהמשחק",
      roomCode: "קוד חדר",
      copyLink: "העתק קישור הזמנה",
      chatPlaceholder: "כתבו משהו...",
      send: "שלח",
      history: "היסטוריית מהלכים",
      noHistory: "אין עדיין מהלכים",
      stats: "סטטיסטיקות",
      pipCount: "ספירת פיפים",
      borneOff: "יצאו",
      hits: "אכילות",
      turns: "תורות",
      time: "זמן",
      difficulty: "רמת קושי",
      easy: "קל",
      medium: "בינוני",
      hard: "קשה",
      start: "התחל משחק",
      rematch: "משחק חוזר",
      backToMenu: "חזרה לתפריט",
    },
    auth: {
      email: "אימייל",
      password: "סיסמה",
      username: "שם משתמש",
      loginTitle: "התחברות",
      signupTitle: "יצירת חשבון",
      submit: "שליחה",
      needsSupabase: "חשבונות אונליין דורשים פרויקט Supabase מוגדר. ראו הוראות התקנה ב-README.",
    },
    leaderboard: {
      title: "טבלת דירוג",
      rank: "דירוג",
      player: "שחקן",
      rating: "ניקוד",
      wins: "ניצחונות",
      losses: "הפסדים",
      empty: "אין עדיין שחקנים מדורגים — חברו את Supabase כדי להפעיל את טבלת הדירוג.",
    },
    profile: {
      title: "פרופיל",
      stats: "סטטיסטיקות",
    },
    theme: {
      light: "בהיר",
      dark: "כהה",
    },
  },
};
