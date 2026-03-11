const countryCodes: Record<string, string> = {
  India: "IND",
  Australia: "AUS",
  England: "ENG",
  Pakistan: "PAK",
  "South Africa": "SA",
  "New Zealand": "NZ",
  "Sri Lanka": "SL",
  Bangladesh: "BAN",
  "West Indies": "WI",
  Afghanistan: "AFG",
  Zimbabwe: "ZIM",
  Ireland: "IRE",
  Canada: "CAN",
  "Hong Kong": "HK",
  Kenya: "KEN",
  Namibia: "NAM",
  Nepal: "NEP",
  Netherlands: "NED",
  Oman: "OMN",
  "Papua New Guinea": "PNG",
  Scotland: "SCO",
  "United Arab Emirates": "UAE",
  "United States of America": "USA",
};

export function getFlag(country: string): string {
  return countryCodes[country] || country.substring(0, 3).toUpperCase();
}
