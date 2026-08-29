const PALETTE = ["#a5673f", "#d79a63", "#2f9e5c", "#4a7fd7", "#b04fc9", "#d1453b", "#3fa5a0"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  username,
  avatarUrl,
  size = 40,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size, border: "1px solid var(--border)" }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: colorFor(username || "?"),
        fontSize: size * 0.42,
        border: "1px solid var(--border)",
      }}
    >
      {(username || "?").charAt(0).toUpperCase()}
    </div>
  );
}
