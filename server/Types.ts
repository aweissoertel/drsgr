/* eslint-disable @typescript-eslint/no-unused-vars */
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

interface RawCountry {
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

interface Region {
  name: string;
  parentRegion: string;
  u_name: string;
  costPerWeek: number;
  attributes: Attributes;
}
