const DEFAULT_K = 32;

export function expectedScore(
  playerElo: number,
  opponentElo: number
): number {
  return 1 / (1 + 10 ** ((opponentElo - playerElo) / 400));
}

export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  score: number,
  k = DEFAULT_K
): number {
  const expected = expectedScore(playerElo, opponentElo);
  return Math.round(k * (score - expected));
}

export function calculateMatchEloChanges(
  playerAElo: number,
  playerBElo: number,
  winnerId: string | null,
  playerAId: string,
  playerBId: string
): Record<string, number> {
  if (!winnerId) {
    const changeA = calculateEloChange(playerAElo, playerBElo, 0.5);
    const changeB = calculateEloChange(playerBElo, playerAElo, 0.5);
    return {
      [playerAId]: changeA,
      [playerBId]: changeB,
    };
  }

  const playerAWon = winnerId === playerAId;
  const changeA = calculateEloChange(
    playerAElo,
    playerBElo,
    playerAWon ? 1 : 0
  );
  const changeB = calculateEloChange(
    playerBElo,
    playerAElo,
    playerAWon ? 0 : 1
  );

  return {
    [playerAId]: changeA,
    [playerBId]: changeB,
  };
}
