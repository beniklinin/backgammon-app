export interface Profile {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  created_at: string;
}

export interface GameRecord {
  id: string;
  room_code: string | null;
  white_player: string | null;
  black_player: string | null;
  winner: "white" | "black" | null;
  win_kind: "normal" | "gammon" | "backgammon" | null;
  moves_count: number;
  created_at: string;
  finished_at: string | null;
}

export interface ChatMessage {
  id: string;
  room_code: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}
