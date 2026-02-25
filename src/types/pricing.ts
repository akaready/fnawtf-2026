export type IconName =
  | 'hammer'
  | 'rocket'
  | 'trending-up'
  | 'lightbulb'
  | 'video'
  | 'sparkles'
  | 'zap'
  | 'users'
  | 'bar-chart'
  | 'coins'
  | 'megaphone';

export interface PricingTier {
  id: 'build' | 'launch' | 'scale';
  name: string;
  tagline: string;
  price: string;
  priceNumber?: number;
  badge?: string;
  ctaText: string;
  ctaHref: string;
  highlighted?: boolean;
  icon: IconName;
  summary: string[];
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  priceSuffix?: string;
  priceDisplay: string;
  description?: string;
  category?: string;
  tier: 'build' | 'launch' | 'fundraising';
  included?: boolean;
  fundraisingFreebie?: boolean;
  perDay?: boolean;
  quantity?: {
    min: number;
    max: number;
    default: number;
    unit: string;
  };
  slider?: {
    min: number;
    max: number;
    step: number;
    default: number;
  };
  multiSlider?: number; // max number of independent slider instances (e.g. 5 locations)
  photoSlider?: {
    included: number;
    max: number;
    extraPrice: number;
  };
  tierToggle?: {
    basic: { label: string; price: number };
    premium: { label: string; price: number };
  };
}

export interface CrowdfundingTier {
  discount: number;
  percentage: number;
  label: string;
}

export interface FundraisingPackage {
  startingPrice: number;
  minimumDown: number;
  minimumDownPercent: number;
  paymentTermDays: number;
  multiplierOnSuccess: number;
  details: string[];
}

/** Serializable calculator state for proposal quotes */
export interface CalculatorState {
  activeTab: 'build' | 'launch' | 'build-launch' | 'fundraising';
  selectedAddOns: Record<string, number>;
  sliderValues: Record<string, number>;
  tierSelections: Record<string, 'basic' | 'premium'>;
  locationDays: Record<string, number[]>;
  photoCount: number;
  crowdfundingEnabled: boolean;
  crowdfundingTierIndex: number;
  fundraisingEnabled: boolean;
  deferPayment: boolean;
  friendlyDiscountPercent: number;
}
