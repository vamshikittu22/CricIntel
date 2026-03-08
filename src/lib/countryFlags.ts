const countryFlags: Record<string, string> = {
  India: "🇮🇳",
  Australia: "🇦🇺",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Pakistan: "🇵🇰",
  "South Africa": "🇿🇦",
  "New Zealand": "🇳🇿",
  "Sri Lanka": "🇱🇰",
  Bangladesh: "🇧🇩",
  "West Indies": "🏴",
  Afghanistan: "🇦🇫",
  Zimbabwe: "🇿🇼",
  Ireland: "🇮🇪",
};

export function getFlag(country: string): string {
  return countryFlags[country] || "🏏";
}
