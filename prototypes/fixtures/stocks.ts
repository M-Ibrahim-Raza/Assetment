// Stocks and funds: what's on PSX and in Pakistani mutual funds, the day's prices, and sample
// holdings. Shares and ETFs are priced at the PSX close, and funds at the NAV that MUFAP publishes
// each day. The names are real, but every price and holding is made up.

/** A share or an ETF trades on PSX. A mutual fund is bought from its AMC at the day's NAV. */
export type SecurityKind = "share" | "etf" | "fund";

export interface Security {
  /** The PSX symbol for a share or ETF. A short code for a fund, which search also matches. */
  symbol: string;
  name: string;
  kind: SecurityKind;
  /** A share's sector, or the AMC that runs an ETF or fund. */
  by: string;
}

export interface StockPrices {
  /** The day of the prices, e.g. "2026-11-12". */
  date: string;
  /** True when they aren't today's, because today's close isn't out yet. */
  stale: boolean;
  /** The close per share, or the NAV per unit, in rupees and paisa, by symbol. */
  prices: Readonly<Record<string, number>>;
}

/**
 * One purchase of a share, ETF or fund: the day, how many, and the price paid a share or unit. A
 * fund's price is the NAV it was bought at.
 */
export interface Buy {
  /** The exact day, e.g. "2024-03-12". */
  date: string;
  /** Shares, or units, which a fund's can have up to 4 decimals. */
  quantity: number;
  /** Rupees and paisa a share or unit. */
  price: number;
}

/** Marks the symbol of a fund the user added by name, which isn't on the list. */
const OWN_FUND = "own:";

/** The symbol of a fund the user added by name: its name, marked as their own. */
export const ownFundSymbol = (name: string): string =>
  `${OWN_FUND}${name.trim()}`;

/** The name of a fund the user added by name. Null for one on the list. */
export const ownFundName = (symbol: string): string | null =>
  symbol.startsWith(OWN_FUND) ? symbol.slice(OWN_FUND.length) : null;

/**
 * One share, ETF or fund the user holds today: the opening balance setup asks for. Each is entered
 * buy by buy, or as how many and the average price. Later buys and sells come through Add trade.
 */
export interface Holding {
  id: string;
  symbol: string;
  /** Shares, or a fund's units, which can have up to 4 decimals. With buys, their total. */
  quantity: number;
  /**
   * The average price paid a share or unit: for a fund, the average NAV it was bought at. With
   * buys, their average. Null when not known.
   */
  averagePrice: number | null;
  /** Entered buy by buy, oldest first. Null when entered as an average. */
  buys: readonly Buy[] | null;
  /**
   * A fund the user added by name, which has no NAV in the day's prices: its NAV, as they typed it
   * from the fund app. It stays until they change it.
   */
  ownNav?: number;
  /**
   * A share or ETF: where it's held. A place's id from `places` ("cdc" for the CDC Investor
   * Account), or the name of a broker the user typed. Null when not said, and for a fund, which its
   * AMC holds.
   */
  heldAt: string | null;
}

/** Somewhere shares are held: a broker, where most people keep them, or the CDC Investor Account. */
export interface Place {
  id: string;
  name: string;
}

/** Shares held in the user's own name at CDC, outside any broker. */
export const CDC_ACCOUNT: Place = { id: "cdc", name: "CDC Investor Account" };

/** Brokers on PSX that many people use, A to Z. Real names; who holds what is made up. */
export const brokers: readonly Place[] = [
  { id: "aba-ali", name: "Aba Ali Habib Securities" },
  { id: "akd", name: "AKD Securities" },
  { id: "arif-habib", name: "Arif Habib Limited" },
  { id: "bma", name: "BMA Capital Management" },
  { id: "foundation", name: "Foundation Securities" },
  { id: "insight", name: "Insight Securities" },
  { id: "intermarket", name: "Intermarket Securities" },
  { id: "ismail-iqbal", name: "Ismail Iqbal Securities" },
  { id: "js-global", name: "JS Global Capital" },
  { id: "kasb", name: "KASB Securities" },
  { id: "munir-khanani", name: "Munir Khanani Securities" },
  { id: "next-capital", name: "Next Capital" },
  { id: "topline", name: "Topline Securities" },
];

/** Every place on the list, by id: the CDC Investor Account and the brokers. */
export const places: Readonly<Record<string, Place>> = Object.fromEntries(
  [CDC_ACCOUNT, ...brokers].map((place) => [place.id, place]),
);

// The commonly held shares come first: they're the chips a new user picks from.
const SHARES = [
  ["LUCK", "Lucky Cement", "Cement", 1_125],
  ["MEBL", "Meezan Bank", "Banks", 343],
  ["HUBC", "The Hub Power Company", "Power", 141.85],
  ["SYS", "Systems Limited", "Technology", 620.5],
  ["OGDC", "Oil & Gas Development Company", "Oil and gas", 272.3],
  ["FFC", "Fauji Fertilizer Company", "Fertilizer", 410.25],
  ["ENGROH", "Engro Holdings", "Conglomerate", 205.6],
  ["PSO", "Pakistan State Oil", "Oil marketing", 420.1],
  ["MCB", "MCB Bank", "Banks", 318.75],
  ["UBL", "United Bank", "Banks", 365.4],
  ["HBL", "Habib Bank", "Banks", 268.9],
  ["MARI", "Mari Energies", "Oil and gas", 640],
  ["PPL", "Pakistan Petroleum", "Oil and gas", 188.45],
  ["EFERT", "Engro Fertilizers", "Fertilizer", 214.3],
  ["BAHL", "Bank AL Habib", "Banks", 176.2],
  ["POL", "Pakistan Oilfields", "Oil and gas", 612.8],
  ["MLCF", "Maple Leaf Cement", "Cement", 108.35],
  ["DGKC", "D.G. Khan Cement", "Cement", 214.6],
  ["SNGP", "Sui Northern Gas Pipelines", "Gas", 118.4],
  ["TRG", "TRG Pakistan", "Technology", 74.9],
  ["ATRL", "Attock Refinery", "Refinery", 702.15],
  ["AIRLINK", "Air Link Communication", "Technology", 168.2],
] as const;

const ETFS = [
  ["MIIETF", "Mahaana Islamic Index ETF", "Mahaana", 14.6],
  ["MZNPETF", "Meezan Pakistan ETF", "Al Meezan", 21.35],
  ["UBLPETF", "UBL Pakistan Enterprise ETF", "UBL Funds", 33.1],
] as const;

// A money market fund keeps its NAV close to flat and pays its profit as new units.
const FUNDS = [
  ["MIF", "Meezan Islamic Fund", "Al Meezan", 79.8488],
  ["MRAF", "Meezan Rozana Amdani Fund", "Al Meezan", 50],
  ["MICF", "Mahaana Islamic Cash Fund", "Mahaana", 112.4512],
  ["NISF", "NBP Islamic Stock Fund", "NBP Funds", 18.4022],
  ["USF", "UBL Stock Advantage Fund", "UBL Funds", 141.256],
  ["HBLMMF", "HBL Money Market Fund", "HBL Asset Management", 109.8834],
  ["MCBPSM", "MCB Pakistan Stock Market Fund", "MCB Funds", 152.771],
  [
    "AIPPF",
    "Alfalah Islamic Prosperity Planning Fund – Active Allocation Plan II (Shariah Compliant Fund of Funds)",
    "Alfalah Asset Management",
    112.531,
  ],
] as const;

const listed = (
  kind: SecurityKind,
  rows: readonly (readonly [string, string, string, number])[],
): Security[] => rows.map(([symbol, name, by]) => ({ symbol, name, kind, by }));

/** Every share, ETF and fund search can find, in the order the pickers show them. */
export const securities: readonly Security[] = [
  ...listed("share", SHARES),
  ...listed("etf", ETFS),
  ...listed("fund", FUNDS),
];

const closes = Object.fromEntries(
  [...SHARES, ...ETFS, ...FUNDS].map(([symbol, , , price]) => [symbol, price]),
);

/** Today's prices: the PSX close and each fund's NAV. */
export const stockPrices: StockPrices = {
  date: "2026-11-12",
  stale: false,
  prices: closes,
};

/** Prices from two days ago, a little lower: today's close isn't out yet. */
export const staleStockPrices: StockPrices = {
  date: "2026-11-10",
  stale: true,
  prices: Object.fromEntries(
    Object.entries(closes).map(([symbol, price]) => [
      symbol,
      Math.round(price * 0.985 * 10_000) / 10_000,
    ]),
  ),
};

type Sample = Omit<Holding, "id">;

/** Most people keep everything at one broker: the samples use AKD unless they say otherwise. */
const share = (
  symbol: string,
  quantity: number,
  averagePrice: number | null,
  heldAt: string | null = "akd",
): Sample => ({
  symbol,
  quantity,
  averagePrice,
  buys: null,
  heldAt,
});

/** A share entered buy by buy: its quantity and average come from the buys. */
const bought = (
  symbol: string,
  buys: readonly Buy[],
  heldAt: string | null = "akd",
): Sample => {
  const quantity = buys.reduce((sum, buy) => sum + buy.quantity, 0);
  const cost = buys.reduce((sum, buy) => sum + buy.quantity * buy.price, 0);
  return {
    ...share(
      symbol,
      quantity,
      Math.round((cost / quantity) * 10_000) / 10_000,
      heldAt,
    ),
    buys,
  };
};

/** A fund: its AMC holds it, so it has no place. Its average is the NAV it was bought at. */
const fund = (
  symbol: string,
  quantity: number,
  averagePrice: number | null,
): Sample => share(symbol, quantity, averagePrice, null);

// The first five are a typical investor's, and add up to Home's Stocks and funds: Rs 1,142,455
// today, at a cost of Rs 1,048,736. HUBC is down, to show a loss. The rest make a heavy portfolio:
// a share with no known price, a money market fund, and the long fund name. Lucky
// Cement and Systems Limited were entered buy by buy. The first five are all at one broker, as
// most people's are. The heavy portfolio also keeps shares elsewhere: Systems Limited in the CDC
// Investor Account, Engro Holdings at a second broker, Pakistan State Oil at a broker the user
// typed in, and more Lucky Cement at CDC, so Lucky Cement is held in two places. The last fund
// isn't on the list: the user added it by name, with its NAV, and entered it buy by buy.
const SAMPLES: readonly Sample[] = [
  bought("LUCK", [
    { date: "2024-03-12", quantity: 100, price: 950 },
    { date: "2025-08-05", quantity: 50, price: 1_160 },
  ]),
  share("MEBL", 800, 248.37),
  share("HUBC", 1_000, 152.1),
  share("MIIETF", 4_000, 13.2),
  fund("MIF", 6_250, 78.7424),
  bought(
    "SYS",
    [
      { date: "2023-05-10", quantity: 800, price: 350 },
      { date: "2024-11-04", quantity: 700, price: 420 },
      { date: "2025-09-18", quantity: 500, price: 490 },
    ],
    "cdc",
  ),
  share("LUCK", 60, 870, "cdc"),
  share("OGDC", 5_000, 180.5),
  share("FFC", 3_000, 231.75),
  share("ENGROH", 1_500, 160, "js-global"),
  share("PSO", 1_000, null, "Darson Securities"),
  share("MCB", 2_500, 210.4),
  fund("MRAF", 40_000, 46.25),
  fund("AIPPF", 12_000.5, 100),
  fund("NISF", 50_000, 19.6),
  fund("USF", 8_000, null),
  {
    ...bought(
      ownFundSymbol("Atlas Islamic Stock Fund"),
      [
        { date: "2024-06-05", quantity: 500, price: 548.2 },
        { date: "2025-03-10", quantity: 400.25, price: 641.75 },
        { date: "2025-10-02", quantity: 300, price: 719.1 },
      ],
      null,
    ),
    ownNav: 802.4135,
  },
];

/** How many sample holdings there are. */
export const SAMPLE_COUNT = SAMPLES.length;

/**
 * The first `count` holdings, up to `SAMPLE_COUNT`, the same every time. Only Lucky Cement is
 * held twice.
 */
export function holdings(count: number): Holding[] {
  return SAMPLES.slice(0, count).map((sample, index) => ({
    ...sample,
    id: `holding-${String(index + 1)}`,
  }));
}
