/**
 * Per-vertical marketing data for the /industries pages.
 * Ported verbatim from the approved prototype (INDUSTRIES).
 */

export type EmailStatusKey = 'deliverable' | 'risky' | 'guess';
export type TierKey = 'A' | 'B' | 'C';

export interface FreeSource {
  /** Registry / source name. */
  n: string;
  /** Jurisdiction note. */
  j: string;
  /** What it yields. */
  y: string;
  /** Source domain / label. */
  src: string;
}

export interface IndustryPerson {
  name: string;
  title: string;
  email: string;
  es: EmailStatusKey;
  chip: string;
  tier: TierKey;
  fit: number;
  intent: number;
  co: string;
}

export interface Industry {
  name: string;
  chip: string;
  headline: string;
  blurb: string;
  /** [businesses, dataCost, contacts] */
  stat: [string, string, string];
  free: FreeSource[];
  sites: string[];
  person: IndustryPerson;
}

export const INDUSTRIES: Record<string, Industry> = {
  construction: {
    name: 'Construction & home services',
    chip: 'Construction',
    headline: 'Every licensed contractor is already on a public board.',
    blurb:
      'Contractors, roofers, HVAC, electrical and plumbing firms all carry a state license, and those boards publish the license holder, trade, status and often a phone. Building permits name the contractor on every job. Most of this is free.',
    stat: ['1,240', '$0.00', '~1,400'],
    free: [
      { n: 'State contractor license boards', j: 'Per state (CSLB, AZ ROC, FL DBPR…)', y: 'License holder, trade class, status, phone', src: 'cslb.ca.gov' },
      { n: 'County building permits', j: 'Per county open-data portals', y: 'Named contractor on every filed permit', src: 'Socrata / city portals' },
      { n: 'OSHA establishment search', j: 'US · DOL', y: 'Firm, size, inspection history', src: 'osha.gov' },
      { n: 'SAM.gov + USASpending', j: 'US · federal', y: 'Government-contracting firms and award history', src: 'sam.gov' },
      { n: 'AGC / ABC / NAHB rosters', j: 'National associations', y: 'Public member directories', src: 'agc.org' },
    ],
    sites: [
      'The company website, team, about, and “our work” pages',
      'Google Business profiles and map listings',
      'Chamber-of-commerce member directories',
      'Trade-association member pages',
    ],
    person: { name: 'Marcus Feld', title: 'Operations manager', email: 'm.feld@ironwoodbuilders.com', es: 'deliverable', chip: 'az roc · registry · 0.99', tier: 'A', fit: 88, intent: 74, co: 'Ironwood Builders' },
  },
  'behavioral-health': {
    name: 'Behavioral health',
    chip: 'Behavioral Health',
    headline: 'Clinicians and facilities are in the NPI registry, for free.',
    blurb:
      'Every licensed US provider has an NPI record with name, specialty and practice address. SAMHSA lists every treatment facility. CMS names individual physicians. State health boards cover the rest, and none of it costs a cent.',
    stat: ['920', '$0.00', '~2,100'],
    free: [
      { n: 'NPI registry (NPPES)', j: 'US · CMS · 9.2M providers', y: 'Provider name, specialty, taxonomy, practice address', src: 'npiregistry.cms.hhs.gov' },
      { n: 'SAMHSA treatment locator', j: 'US · FindTreatment.gov', y: 'Every state-licensed treatment facility and services', src: 'findtreatment.gov' },
      { n: 'CMS provider data / Care Compare', j: 'US · Open Payments', y: 'Names individual physicians and clinics', src: 'data.cms.gov' },
      { n: 'State health licensing boards', j: 'Per state', y: 'Facility and clinician license lookups', src: 'state boards' },
      { n: 'Medicaid provider directories', j: 'Per state', y: 'Enrolled behavioral-health providers', src: 'state Medicaid' },
    ],
    sites: [
      'The practice or facility website, staff and leadership pages',
      'Google Business profiles',
      'Psychology Today and directory listings (public)',
      'Hospital and health-system org charts',
    ],
    person: { name: 'Dana Reyes', title: 'Director of operations', email: 'd.reyes@sunridgebehavioral.com', es: 'deliverable', chip: 'npi · registry · 0.99', tier: 'A', fit: 91, intent: 74, co: 'Sunridge Behavioral' },
  },
  'real-estate': {
    name: 'Real estate',
    chip: 'Real Estate',
    headline: 'Owners and agents are in assessor and license records.',
    blurb:
      'County assessors publish parcel ownership with a mailing address, a direct path to the owner. State boards license every broker and agent. HUD lists multifamily owners. Public REIT leadership is in SEC filings.',
    stat: ['1,600', '$0.00', '~1,900'],
    free: [
      { n: 'County assessor parcel records', j: 'Per county', y: 'Parcel ownership and owner mailing address', src: 'county assessors' },
      { n: 'State real-estate license boards', j: 'Per state (AZ ADRE, CA DRE…)', y: 'Licensed brokers and agents', src: 'adre.az.gov' },
      { n: 'HUD / FHFA', j: 'US', y: 'Multifamily and assisted-housing owners', src: 'hud.gov' },
      { n: 'SEC EDGAR', j: 'US · public REITs', y: 'Officers and leadership of public real-estate firms', src: 'sec.gov/edgar' },
      { n: 'Secretary of State filings', j: 'Per state', y: 'LLC owners behind property entities', src: 'state SoS' },
    ],
    sites: [
      'The brokerage or firm website, agent roster and team pages',
      'Google Business profiles',
      'Zillow / Realtor public agent profiles',
      'Property-management company sites',
    ],
    person: { name: 'Priya Nair', title: 'Managing broker', email: 'priya@meridianproperty.com', es: 'deliverable', chip: 'scrape · mailto · 0.97', tier: 'A', fit: 84, intent: 66, co: 'Meridian Property' },
  },
  'financial-services': {
    name: 'Financial services & insurance',
    chip: 'Financial Services',
    headline: 'Advisors, brokers and agents are all publicly registered.',
    blurb:
      'FINRA BrokerCheck and the SEC’s IAPD name every broker and investment adviser with employment history. NMLS covers mortgage originators. State insurance departments license every producer. All free, all public.',
    stat: ['780', '$0.00', '~1,100'],
    free: [
      { n: 'FINRA BrokerCheck', j: 'US · free', y: 'Brokers, firms, employment history, disclosures', src: 'brokercheck.finra.org' },
      { n: 'SEC IAPD / Form ADV', j: 'US · free', y: 'Registered investment advisers, AUM, principals', src: 'adviserinfo.sec.gov' },
      { n: 'NMLS Consumer Access', j: 'US · free', y: 'Mortgage originators and companies by NMLS ID', src: 'nmlsconsumeraccess.org' },
      { n: 'State insurance departments', j: 'Per state · NAIC', y: 'Licensed insurance producers and agencies', src: 'naic.org' },
      { n: 'FDIC / NCUA', j: 'US', y: 'Banks and credit unions with officers', src: 'fdic.gov' },
    ],
    sites: [
      'The firm website, team, advisors, and leadership pages',
      'Google Business profiles',
      'LinkedIn public company pages (public only)',
      'RIA and broker-dealer disclosure brochures',
    ],
    person: { name: 'Grant Walsh', title: 'Managing partner', email: 'gwalsh@keystoneadvisors.com', es: 'deliverable', chip: 'finra · registry · 0.98', tier: 'A', fit: 81, intent: 70, co: 'Keystone Advisors' },
  },
  hospitality: {
    name: 'Hospitality & food',
    chip: 'Hospitality',
    headline: 'Liquor licenses and health inspections name the operator.',
    blurb:
      'State liquor boards license every bar, restaurant and venue, and the license often names the owner. TTB lists every brewery, winery and distillery. County health inspections cover the rest. Free.',
    stat: ['1,100', '$0.00', '~1,300'],
    free: [
      { n: 'State liquor license boards', j: 'Per state (TX TABC, AZ DLLC…)', y: 'License holders, often the owner name', src: 'tabc.texas.gov' },
      { n: 'TTB', j: 'US', y: 'Breweries, wineries and distillers with owner names', src: 'ttb.gov' },
      { n: 'County health inspections', j: 'Per county (Socrata / LIVES)', y: 'Restaurant operators and locations', src: 'county portals' },
      { n: 'openFDA / USDA FSIS', j: 'US', y: 'Food facility registrations', src: 'open.fda.gov' },
      { n: 'Secretary of State filings', j: 'Per state', y: 'Ownership entities behind venues', src: 'state SoS' },
    ],
    sites: [
      'The restaurant or group website, about and team pages',
      'Google Business profiles and menus',
      'Yelp and OpenTable public listings',
      'Hospitality-group corporate sites',
    ],
    person: { name: 'Leo Bianchi', title: 'General manager', email: 'leo@lakesidehospitality.com', es: 'deliverable', chip: 'scrape · mailto · 0.96', tier: 'B', fit: 76, intent: 60, co: 'Lakeside Hospitality' },
  },
  manufacturing: {
    name: 'Manufacturing & distribution',
    chip: 'Manufacturing',
    headline: 'Plants and carriers are in EPA, FMCSA and Census data.',
    blurb:
      'EPA lists facilities with permits and NAICS codes. FMCSA names every motor carrier. OSHA has establishment size. Census County Business Patterns counts firms by industry and geography. All free.',
    stat: ['640', '$0.00', '~900'],
    free: [
      { n: 'EPA FRS / ECHO', j: 'US', y: 'Facilities, permits, NAICS, and contacts', src: 'echo.epa.gov' },
      { n: 'FMCSA', j: 'US · free key', y: 'Motor carriers and safety records', src: 'fmcsa.dot.gov' },
      { n: 'OSHA establishment search', j: 'US · DOL', y: 'Establishment, size and inspections', src: 'osha.gov' },
      { n: 'Census County Business Patterns', j: 'US', y: 'Plant and firm counts by NAICS and geo', src: 'census.gov' },
      { n: 'SAM.gov', j: 'US · federal', y: 'Manufacturers with government contracts', src: 'sam.gov' },
    ],
    sites: [
      'The manufacturer website, leadership and contact pages',
      'Google Business profiles',
      'ThomasNet and industry directory listings',
      'Distributor and supplier network pages',
    ],
    person: { name: 'Raj Mehta', title: 'Plant manager', email: 'r.mehta@forgeworks.com', es: 'risky', chip: 'pdl · api · 0.68', tier: 'B', fit: 64, intent: 44, co: 'Forgeworks' },
  },
  automotive: {
    name: 'Automotive',
    chip: 'Automotive',
    headline: 'Dealers are on state license rolls, VINs decode to makers.',
    blurb:
      'Every state licenses auto dealers and publishes the principals. NHTSA’s vPIC decodes manufacturers. Secretary-of-State filings cover ownership. Free public data.',
    stat: ['520', '$0.00', '~700'],
    free: [
      { n: 'State dealer license rolls', j: 'Per state DMV', y: 'Licensed dealers and their principals', src: 'state DMV' },
      { n: 'NHTSA vPIC', j: 'US', y: 'VIN decode and manufacturer data', src: 'vpic.nhtsa.dot.gov' },
      { n: 'Secretary of State filings', j: 'Per state', y: 'Dealership ownership entities', src: 'state SoS' },
      { n: 'BLS / Census CBP', j: 'US', y: 'Dealership counts by geography', src: 'census.gov' },
    ],
    sites: [
      'The dealership website, staff and management pages',
      'Google Business profiles',
      'Cars.com / dealer-locator listings',
      'Dealer-group corporate sites',
    ],
    person: { name: 'Owen Brooks', title: 'Fixed ops director', email: 'o.brooks@precisionauto.com', es: 'deliverable', chip: 'scrape · mailto · 0.98', tier: 'A', fit: 83, intent: 71, co: 'Precision Auto Group' },
  },
  'professional-services': {
    name: 'Professional services',
    chip: 'Professional Services',
    headline: 'Attorneys and CPAs are in bar and license directories.',
    blurb:
      'State bars publish every attorney with firm and admission date. CPAverify lists licensed accountants. SEC EDGAR and Secretary-of-State filings cover the firms. All free and public.',
    stat: ['860', '$0.00', '~1,050'],
    free: [
      { n: 'State bar directories', j: 'Per state', y: 'Attorneys, name, firm, admission date', src: 'state bars' },
      { n: 'CPAverify', j: 'US · free', y: 'Licensed CPAs and accounting firms', src: 'cpaverify.org' },
      { n: 'SEC EDGAR', j: 'US', y: 'Officers of public professional firms', src: 'sec.gov/edgar' },
      { n: 'Secretary of State filings', j: 'Per state', y: 'Firm registrations, officers, agents', src: 'state SoS' },
    ],
    sites: [
      'The firm website, attorney / partner / team pages',
      'Google Business profiles',
      'Avvo / Martindale public profiles',
      'Firm practice-group and bio pages',
    ],
    person: { name: 'Elena Ford', title: 'Managing partner', email: 'e.ford@harborlaw.com', es: 'deliverable', chip: 'bar · registry · 0.99', tier: 'A', fit: 80, intent: 62, co: 'Harbor Law' },
  },
};

export const INDUSTRY_SLUGS = Object.keys(INDUSTRIES);
