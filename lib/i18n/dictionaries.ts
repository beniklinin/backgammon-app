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
    copied: string;
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
    waitingForOpponent: string;
    youAreWhite: string;
    youAreBlack: string;
    spectating: string;
    spectators: string;
    opponentDisconnected: string;
    opponentJoined: string;
    ranked: string;
    unranked: string;
    unrankedHint: string;
    signInForRanked: string;
    connecting: string;
    needsSupabaseOnline: string;
  };
  auth: {
    email: string;
    password: string;
    username: string;
    loginTitle: string;
    signupTitle: string;
    submit: string;
    needsSupabase: string;
    confirmEmail: string;
    haveAccount: string;
    noAccount: string;
    usernameHint: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    rank: string;
    player: string;
    rating: string;
    wins: string;
    losses: string;
    empty: string;
    allTime: string;
    weekly: string;
    monthly: string;
    you: string;
  };
  profile: {
    title: string;
    stats: string;
    gamesPlayed: string;
    winRate: string;
    recentGames: string;
    noGames: string;
    achievements: string;
    memberSince: string;
    viewReplay: string;
    notFound: string;
    rankedGamesOnly: string;
    vs: string;
    you: string;
    loginPrompt: string;
    practice: string;
    deletedPlayer: string;
    changeAvatar: string;
    uploading: string;
    uploadError: string;
  };
  achievements: Record<
    "firstWin" | "tenGames" | "fiftyGames" | "streak3" | "streak5" | "gammonWin" | "backgammonWin" | "rating1200" | "rating1400",
    { name: string; description: string }
  >;
  replay: {
    title: string;
    move: string;
    of: string;
    play: string;
    pause: string;
    prev: string;
    next: string;
    restart: string;
    back: string;
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
      copied: "Copied!",
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
      waitingForOpponent: "Waiting for an opponent to join...",
      youAreWhite: "You're playing White",
      youAreBlack: "You're playing Black",
      spectating: "Spectating",
      spectators: "Spectators",
      opponentDisconnected: "Opponent disconnected",
      opponentJoined: "Opponent joined!",
      ranked: "Ranked match",
      unranked: "Unranked",
      unrankedHint: "Sign in to play ranked matches and affect your rating.",
      signInForRanked: "Sign in for a ranked, rated match",
      connecting: "Connecting to room...",
      needsSupabaseOnline:
        "Online rooms require a configured Supabase project. See the README for setup instructions.",
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
      confirmEmail: "Account created! Check your email to confirm it, then log in.",
      haveAccount: "Already have an account? Log in",
      noAccount: "Don't have an account? Sign up",
      usernameHint: "3-20 characters, shown on the leaderboard and your profile.",
    },
    leaderboard: {
      title: "Leaderboard",
      subtitle: "Top players, ranked by rating from online matches",
      rank: "Rank",
      player: "Player",
      rating: "Rating",
      wins: "Wins",
      losses: "Losses",
      empty: "No ranked players yet — connect Supabase to enable the leaderboard.",
      allTime: "All-time",
      weekly: "This week",
      monthly: "This month",
      you: "You",
    },
    profile: {
      title: "Profile",
      stats: "Stats",
      gamesPlayed: "Games played",
      winRate: "Win rate",
      recentGames: "Recent games",
      noGames: "No games yet — play an online match to build your history.",
      achievements: "Achievements",
      memberSince: "Member since",
      viewReplay: "Watch replay",
      notFound: "Player not found.",
      rankedGamesOnly: "Ranked online matches only",
      vs: "vs",
      you: "You",
      loginPrompt: "Log in to see your profile, stats, and achievements.",
      practice: "Practice",
      deletedPlayer: "Deleted player",
      changeAvatar: "Change photo",
      uploading: "Uploading...",
      uploadError: "Couldn't upload that image.",
    },
    achievements: {
      firstWin: { name: "First win", description: "Win your first ranked match" },
      tenGames: { name: "Regular", description: "Play 10 ranked matches" },
      fiftyGames: { name: "Veteran", description: "Play 50 ranked matches" },
      streak3: { name: "On a roll", description: "Win 3 ranked matches in a row" },
      streak5: { name: "Unstoppable", description: "Win 5 ranked matches in a row" },
      gammonWin: { name: "Gammon!", description: "Win a ranked match by gammon" },
      backgammonWin: { name: "Backgammon!", description: "Win a ranked match by backgammon" },
      rating1200: { name: "Rising star", description: "Reach a rating of 1200" },
      rating1400: { name: "Expert", description: "Reach a rating of 1400" },
    },
    replay: {
      title: "Replay",
      move: "Move",
      of: "of",
      play: "Play",
      pause: "Pause",
      prev: "Previous",
      next: "Next",
      restart: "Restart",
      back: "Back to profile",
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
      copied: "הועתק!",
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
      waitingForOpponent: "ממתין להצטרפות יריב...",
      youAreWhite: "אתם משחקים בלבן",
      youAreBlack: "אתם משחקים בשחור",
      spectating: "צפייה בלבד",
      spectators: "צופים",
      opponentDisconnected: "היריב התנתק",
      opponentJoined: "היריב הצטרף!",
      ranked: "משחק מדורג",
      unranked: "לא מדורג",
      unrankedHint: "התחברו כדי לשחק משחקים מדורגים שמשפיעים על הדירוג שלכם.",
      signInForRanked: "התחברו למשחק מדורג עם ניקוד",
      connecting: "מתחבר לחדר...",
      needsSupabaseOnline: "חדרים אונליין דורשים פרויקט Supabase מוגדר. ראו הוראות התקנה ב-README.",
    },
    auth: {
      email: "אימייל",
      password: "סיסמה",
      username: "שם משתמש",
      loginTitle: "התחברות",
      signupTitle: "יצירת חשבון",
      submit: "שליחה",
      needsSupabase: "חשבונות אונליין דורשים פרויקט Supabase מוגדר. ראו הוראות התקנה ב-README.",
      confirmEmail: "החשבון נוצר! בדקו את האימייל לאישור, ואז התחברו.",
      haveAccount: "כבר יש לכם חשבון? התחברו",
      noAccount: "אין לכם חשבון? הירשמו",
      usernameHint: "3-20 תווים, יוצג בטבלת הדירוג ובפרופיל שלכם.",
    },
    leaderboard: {
      title: "טבלת דירוג",
      subtitle: "השחקנים המובילים, מדורגים לפי ניקוד ממשחקים אונליין",
      rank: "דירוג",
      player: "שחקן",
      rating: "ניקוד",
      wins: "ניצחונות",
      losses: "הפסדים",
      empty: "אין עדיין שחקנים מדורגים — חברו את Supabase כדי להפעיל את טבלת הדירוג.",
      allTime: "כל הזמנים",
      weekly: "השבוע",
      monthly: "החודש",
      you: "אתם",
    },
    profile: {
      title: "פרופיל",
      stats: "סטטיסטיקות",
      gamesPlayed: "משחקים ששוחקו",
      winRate: "אחוז ניצחונות",
      recentGames: "משחקים אחרונים",
      noGames: "אין עדיין משחקים — שחקו משחק אונליין כדי לבנות היסטוריה.",
      achievements: "הישגים",
      memberSince: "חבר/ה מאז",
      viewReplay: "צפייה בהקלטה",
      notFound: "השחקן לא נמצא.",
      rankedGamesOnly: "משחקי אונליין מדורגים בלבד",
      vs: "נגד",
      you: "אתם",
      loginPrompt: "התחברו כדי לראות את הפרופיל, הסטטיסטיקות וההישגים שלכם.",
      practice: "תרגול",
      deletedPlayer: "שחקן שנמחק",
      changeAvatar: "שנה תמונה",
      uploading: "מעלה...",
      uploadError: "לא הצלחנו להעלות את התמונה.",
    },
    achievements: {
      firstWin: { name: "ניצחון ראשון", description: "נצחו במשחק מדורג ראשון" },
      tenGames: { name: "קבוע", description: "שחקו 10 משחקים מדורגים" },
      fiftyGames: { name: "ותיק", description: "שחקו 50 משחקים מדורגים" },
      streak3: { name: "בתנופה", description: "נצחו 3 משחקים מדורגים ברצף" },
      streak5: { name: "בלתי ניתן לעצירה", description: "נצחו 5 משחקים מדורגים ברצף" },
      gammonWin: { name: "גאמון!", description: "נצחו במשחק מדורג בגאמון" },
      backgammonWin: { name: "בקגאמון!", description: "נצחו במשחק מדורג בבקגאמון" },
      rating1200: { name: "כוכב עולה", description: "הגיעו לדירוג 1200" },
      rating1400: { name: "מומחה", description: "הגיעו לדירוג 1400" },
    },
    replay: {
      title: "הקלטת משחק",
      move: "מהלך",
      of: "מתוך",
      play: "נגן",
      pause: "השהה",
      prev: "הקודם",
      next: "הבא",
      restart: "מהתחלה",
      back: "חזרה לפרופיל",
    },
    theme: {
      light: "בהיר",
      dark: "כהה",
    },
  },
};
