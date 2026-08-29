// Standard ELO rating update, computed client-side on game end. RLS scopes
// each player to updating only their own profile row, so both clients in an
// online match independently write their own new rating — no server needed.

const K_FACTOR = 32;

/** Probability that `ratingA` beats `ratingB`, per the logistic ELO curve. */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/**
 * New rating for a player with `rating`, given the opponent's `opponentRating`
 * and whether they won (`didWin`). Result is rounded and floored at 100 so a
 * long losing streak can't send a rating negative or absurdly low.
 */
export function nextRating(rating: number, opponentRating: number, didWin: boolean): number {
  const expected = expectedScore(rating, opponentRating);
  const actual = didWin ? 1 : 0;
  const updated = rating + K_FACTOR * (actual - expected);
  return Math.max(100, Math.round(updated));
}
