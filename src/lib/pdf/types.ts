export interface QuoteLineItem {
  name: string;
  price: number;
}

export interface QuoteData {
  date: string;             // e.g. "February 21, 2026"
  tier: string;             // e.g. "Build + Launch"
  buildItems: QuoteLineItem[];
  launchItems: QuoteLineItem[];
  fundraisingItems: QuoteLineItem[];
  buildBase: number;
  launchBase: number;
  fundraisingBase: number;
  overhead: number;
  overheadWaived: boolean;
  deferredFee: number;
  crowdfundingDiscount: number;
  crowdfundingPercent: number;
  friendlyDiscount: number;
  friendlyDiscountPercent: number;
  total: number;
  downPercent: number;      // 40 or 20
  downAmount: number;
  specialProgram: 'crowdfunding' | 'fundraising' | null;
  deferPayment: boolean;
}

export interface ContactInfo {
  name: string;
  company: string;
  email: string;
  timeline?: string;
  timelineDate?: string;
}

export const PLACEHOLDER_CONTACT: ContactInfo = {
  name: 'Art Vandelay',
  company: 'Vandelay Industries',
  email: 'art@vandelayindustries.com',
};
