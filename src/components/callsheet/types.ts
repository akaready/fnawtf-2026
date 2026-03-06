// ── Call Sheet Types ──────────────────────────────────────────

export interface CallSheetData {
  id: string;
  jobId: string; // 3-letter + 4-digit code, e.g. "COM0100"
  projectTitle: string;
  projectType: string; // "Advert", "Short Film", "Music Video", etc.
  projectThumbnail: string | null;
  shootDay: number;
  totalDays: number;
  date: string; // ISO date string
  callTime: string; // "8:00 AM"
  safetyNote: string | null;

  production: ProductionInfo;
  weather: WeatherInfo | null;
  schedule: ScheduleTimes;
  bulletins: BulletinNote[];
  locations: CallSheetLocations;
  cast: CastMember[];
  crew: CrewMember[];
  specialInstructions: SpecialInstruction[];
  scenes: SceneScheduleItem[];
  vendors: VendorInfo[];
}

export interface ProductionInfo {
  companyName: string;
  companyLogo: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  keyCrew: KeyCrewMember[];
}

export interface KeyCrewMember {
  role: string; // "Director", "Producer", "1st AD"
  name: string;
  headshot: string | null;
}

export interface WeatherInfo {
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
  description: string; // "Mostly sunny throughout the day"
  tempHigh: number;
  tempLow: number;
  sunrise: string; // "6:12am"
  sunset: string; // "6:45pm"
}

export interface ScheduleTimes {
  crewCall: string;
  talentCall: string | null;
  shootingCall: string | null;
  lunch: string | null;
  estimatedWrap: string | null;
  custom: { label: string; time: string }[];
}

export interface BulletinNote {
  id: string;
  text: string;
  pinned: boolean;
}

export interface CallSheetLocations {
  set: LocationInfo | null;
  parking: LocationInfo | null;
  hospital: LocationInfo | null;
}

export interface LocationInfo {
  name: string;
  address: string | null;
  phone: string | null;
  note: string | null;
  mapsUrl: string | null;
}

export interface CastMember {
  id: number; // Cast number (#1, #2, etc.)
  name: string;
  role: string; // Character name
  headshot: string | null;
  status: 'W' | 'SW' | 'SWF' | 'H' | 'D'; // Work, Start/Work, Start/Work/Finish, Hold, Drop
  pickup: string | null;
  callTime: string;
  hmua: string | null; // Hair/Makeup arrival
  onSet: string | null;
  wrap: string | null;
}

export interface CrewMember {
  name: string;
  title: string; // "Director of Photography", "Key Grip"
  phone: string | null;
  email: string | null;
  callTime: string;
  wrap: string | null; // Anticipated wrap
}

export interface SpecialInstruction {
  category: string; // "CAMERA", "GRIP", "SOUND", etc.
  notes: string;
}

export interface SceneScheduleItem {
  sceneId: string; // "4", "5A", "5B" — scene identifier
  description: string;
  intExt: string; // "INT", "EXT", "INT/EXT"
  location: string; // Location name
  timeOfDay: string; // "DAY", "NIGHT", "DAWN", "DUSK"
  cast: number[]; // Cast member IDs involved
  estimatedStart: string; // "10:00 AM"
  estimatedEnd: string; // "11:30 AM"
  notes: string | null;
}

export interface VendorInfo {
  name: string;
  role: string; // "Catering", "Equipment Rental", "Grip Truck"
  phone: string | null;
  contact: string | null; // Contact person name
}
