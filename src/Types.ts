/* eslint-disable @typescript-eslint/no-unused-vars */
interface RawCountries {
  ParentRegion: string;
  Region: string;
  u_name: string;
  costPerWeek: number;
  jan: Rating;
  feb: Rating;
  mar: Rating;
  apr: Rating;
  may: Rating;
  jun: Rating;
  jul: Rating;
  aug: Rating;
  sep: Rating;
  oct: Rating;
  nov: Rating;
  dec: Rating;
  safety: Rating;
  nature: Rating;
  hiking: Rating;
  beach: Rating;
  watersports: Rating;
  entertainment: Rating;
  wintersports: Rating;
  culture: Rating;
  culinary: Rating;
  architecture: Rating;
  shopping: Rating;
}

type Rating = '++' | '+' | 'o' | '-' | '--';

interface UserPreferences {
  isPriceImportant: boolean;
  stay: number;
  budget: number;
  attributes: Attributes;
}

interface MapCountry {
  type: string;
  properties: {
    u_name: string;
    AREA: number;
    PERIMETER: number;
    // country?: string;
    // name?: string;
    // result?: CompleteResult;
  };
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
}

interface RankResult {
  u_name: string;
  rank: number;
  rankReverse: number;
  rankOverBudget: number;
  totalScore: number;
  overBudget: boolean;
}

interface FullCountry extends MapCountry {
  name: string;
  parentRegion: string;
  costPerWeek: number;
  attributes: Attributes;
  rankResult: RankResult;
  favorites: {
    best: string[];
    second: string[];
    third: string[];
    topTen: string[];
  };
}

interface Attributes {
  nature: number;
  architecture: number;
  hiking: number;
  wintersports: number;
  beach: number;
  culture: number;
  culinary: number;
  entertainment: number;
  shopping: number;
}

interface CompleteResult {
  country?: string;
  region: string;
  uname?: string;
  price: number;
  qualifications: Attributes;
  scores: {
    totalScore: number;
    attr: Attributes;
  };
}

interface Score {
  name: string;
  value: number;
}

interface GroupRecommendation {
  id: string;
  sessionCode: string;
  userVotes?: UserVote[];
  votingEnded: boolean;
  aggregationResultsAR?: AggregationResult[];
  aggregationResultsAP?: AggregationResult[];
  aggregatedInput?: AggregatedInput;
  qrcode: string;
  stayDays: number;
  description: string;
  concluded: boolean;
  finalWinners?: RankResult[];
}

interface UserVote {
  id: string;
  name: string;
  preferences: Attributes;
  budget: number;
}

interface AggregationResult {
  id: string;
  method: string;
  rankedCountries: RankResult[];
}

interface Region {
  name: string;
  parentRegion: string;
  u_name: string;
  costPerWeek: number;
  attributes: Attributes;
}

interface AggregatedInput {
  multiAP: Attributes;
  averageAP: Attributes;
  bordaCountAP: Attributes;
  mostPleasureAP: Attributes;
  recommendationsPerUserVote: {
    list: RankResult[];
    name: string;
  }[];
}

interface FinalVote {
  id: string;
  name: string;
  recommendationId: string;
  first: string;
  second: string;
  third: string;
}
