/**
 * The full provider catalog — public registries, scrape infra, enrichment,
 * verification, and delivery targets. This is the single source of truth for:
 *  - the Sources screen in the dashboard
 *  - the Build pipeline editor
 *  - the worker's adapter dispatch (adapters are keyed by `name`)
 *
 * `kind`:
 *   free    — public/no-cost source, always available
 *   builtin — infra we run ourselves (Playwright, MX/SMTP, CSV)
 *   gov     — free but needs a (free) government key
 *   paid    — metered third-party API, gated behind the paid master switch
 *   ai      — LLM provider (billed to the customer's own key)
 */

export type ProviderKind = 'free' | 'builtin' | 'gov' | 'paid' | 'ai';

export interface ProviderDef {
  name: string;
  kind: ProviderKind;
  /** Plain-language description. */
  tag: string;
  /** e.g. '$0.04/lookup'. Present for paid providers. */
  cost?: string;
  /** 'all' or a list of verticals this source is most useful for. */
  verticals?: 'all' | string[];
  /** Jurisdiction note for registries. */
  jurisdiction?: string;
  /** Rate-limit / access note. */
  rateNote?: string;
  /** Whether the provider needs a key to function. */
  needsKey?: boolean;
  /** Whether we link out to a "get a free key" flow. */
  getKey?: boolean;
}

export interface ProviderCategory {
  cat: string;
  items: ProviderDef[];
}

export const PROVIDER_CATALOG: ProviderCategory[] = [
  {
    cat: 'Discovery',
    items: [
      { name: 'Google Places', kind: 'free', tag: 'Finds businesses and their websites from a name, category, or map area.', verticals: 'all' },
      { name: 'Common Crawl', kind: 'free', tag: 'Free public web index for locating pages without a paid search call.', verticals: 'all' },
      { name: 'Census Geocoder', kind: 'free', tag: 'Address normalization and ZIP→county for territory search.', jurisdiction: 'US', verticals: 'all' },
      { name: 'Apollo Org Search', kind: 'paid', cost: '$0.03/org', tag: 'Searches Apollo’s company database by industry, size, and geography.', verticals: 'all' },
      { name: 'Exa', kind: 'paid', cost: '$0.005/query', tag: 'Neural search — find companies that look like an example you already have.', verticals: 'all' },
      { name: 'Crunchbase', kind: 'paid', cost: '$0.04/lookup', tag: 'Company profiles, funding history, and leadership.', verticals: ['B2B Services', 'Financial'] },
      { name: 'D&B Hoovers', kind: 'paid', cost: '$0.10/lookup', tag: 'Enterprise firmographics and corporate family trees.', verticals: ['B2B Services', 'Financial', 'Manufacturing'] },
    ],
  },
  {
    cat: 'Search',
    items: [
      { name: 'Serper', kind: 'paid', cost: '$0.001/query', tag: 'Runs Google queries to locate team, about, and contact pages.', verticals: 'all' },
      { name: 'SerpAPI', kind: 'paid', cost: '$0.003/query', tag: 'Structured SERP results across engines.', verticals: 'all' },
      { name: 'Bright Data SERP', kind: 'paid', cost: '$0.002/query', tag: 'Search at volume on the most defensible legal footing.', verticals: 'all' },
      { name: 'Tavily', kind: 'paid', cost: '$0.002/query', tag: 'LLM-friendly web search built for the agent.', verticals: 'all' },
    ],
  },
  {
    cat: 'Scrape infrastructure',
    items: [
      { name: 'Playwright', kind: 'builtin', tag: 'Built-in headless browser for JavaScript-rendered sites.', verticals: 'all' },
      { name: 'Plain fetch', kind: 'builtin', tag: 'Fast static fetch for simple, server-rendered pages.', verticals: 'all' },
      { name: 'Bright Data', kind: 'paid', cost: '$0.04/page', tag: 'Proxy network with the strongest legal track record for public-data scraping.', verticals: 'all' },
      { name: 'Apify', kind: 'paid', cost: '$0.05/page', tag: 'Handles heavy or anti-bot sites when the browser gets blocked.', verticals: 'all' },
      { name: 'ScrapingBee', kind: 'paid', cost: '$0.04/page', tag: 'Rotating-proxy rendering for hard, rate-limited targets.', verticals: 'all' },
      { name: 'Zyte', kind: 'paid', cost: '$0.05/page', tag: 'Managed extraction with automatic ban handling.', verticals: 'all' },
      { name: 'Oxylabs', kind: 'paid', cost: '$0.045/page', tag: 'Enterprise proxy and scraper APIs.', verticals: 'all' },
    ],
  },
  {
    cat: 'Company & firmographic',
    items: [
      { name: 'PDL Company', kind: 'paid', cost: '$0.05/enrich', tag: 'Headcount, revenue band, and tech stack for a domain.', verticals: 'all' },
      { name: 'Clearbit', kind: 'paid', cost: '$0.04/enrich', tag: 'Company size, industry, and revenue signals (now Breeze).', verticals: ['B2B Services', 'Financial', 'CPG & Retail'] },
      { name: 'ZoomInfo', kind: 'paid', cost: '$0.12/enrich', tag: 'Deep B2B firmographics and org charts.', verticals: ['B2B Services', 'Financial'] },
      { name: 'Cognism', kind: 'paid', cost: '$0.10/enrich', tag: 'Compliant B2B company and contact data.', verticals: ['B2B Services'] },
      { name: 'BuiltWith', kind: 'paid', cost: '$0.03/lookup', tag: 'Tech stack and platform detection for a domain.', verticals: ['B2B Services'] },
      { name: 'Similarweb', kind: 'paid', cost: '$0.06/lookup', tag: 'Traffic and market-share signals.', verticals: ['B2B Services', 'CPG & Retail'] },
      { name: 'PredictLeads', kind: 'paid', cost: '$0.05/enrich', tag: 'Job postings, tech changes, and news as buying intent.', verticals: 'all' },
      { name: 'Bombora', kind: 'paid', cost: '$0.08/enrich', tag: 'Third-party intent signals by topic.', verticals: ['B2B Services'] },
    ],
  },
  {
    cat: 'Person enrichment',
    items: [
      { name: 'Apollo', kind: 'paid', cost: '$0.03/match', tag: 'Matches a person to verified role, seniority, and contact details.', verticals: 'all' },
      { name: 'PDL Person', kind: 'paid', cost: '$0.08/enrich', tag: 'Role history, work profile, and contact points for a named person.', verticals: 'all' },
      { name: 'RocketReach', kind: 'paid', cost: '$0.06/lookup', tag: 'Direct dials and emails for a specific named person.', verticals: ['B2B Services', 'Financial'] },
      { name: 'Lusha', kind: 'paid', cost: '$0.07/lookup', tag: 'Business contact details for a named person.', verticals: ['B2B Services'] },
      { name: 'Seamless.ai', kind: 'paid', cost: '$0.05/lookup', tag: 'Real-time contact search for sales teams.', verticals: ['B2B Services'] },
      { name: 'Coresignal', kind: 'paid', cost: '$0.06/enrich', tag: 'Firmographic and employee data from public sources.', verticals: ['B2B Services'] },
      { name: 'Clay', kind: 'paid', cost: '$0.09/run', tag: 'Orchestrates a waterfall across all your other enrichment keys.', verticals: 'all' },
    ],
  },
  {
    cat: 'Email finding',
    items: [
      { name: 'Hunter', kind: 'paid', cost: '$0.04/lookup', tag: 'Finds the most likely email for a name at a domain.', verticals: 'all' },
      { name: 'Snov.io', kind: 'paid', cost: '$0.02/lookup', tag: 'Email finder with bulk domain search.', verticals: 'all' },
      { name: 'Prospeo', kind: 'paid', cost: '$0.02/lookup', tag: 'Email finder with high match rates.', verticals: 'all' },
      { name: 'Findymail', kind: 'paid', cost: '$0.03/lookup', tag: 'Verified B2B emails with low bounce rates.', verticals: ['B2B Services'] },
      { name: 'Dropcontact', kind: 'paid', cost: '$0.03/lookup', tag: 'GDPR-native email finding for EU contacts.', verticals: ['B2B Services', 'Financial'] },
      { name: 'LeadMagic', kind: 'paid', cost: '$0.03/lookup', tag: 'Email and mobile finder with waterfall fallback.', verticals: 'all' },
      { name: 'AnyMailFinder', kind: 'paid', cost: '$0.02/lookup', tag: 'Pay-per-verified-email finder.', verticals: 'all' },
    ],
  },
  {
    cat: 'Email verification',
    items: [
      { name: 'MX / SMTP', kind: 'builtin', tag: 'Checks the mail server actually accepts the address. Always on, free.', verticals: 'all' },
      { name: 'NeverBounce', kind: 'paid', cost: '$0.008/email', tag: 'Deep verification with catch-all detection.', verticals: 'all' },
      { name: 'ZeroBounce', kind: 'paid', cost: '$0.009/email', tag: 'Deep verification plus abuse and spam-trap flags.', verticals: 'all' },
      { name: 'Emailable', kind: 'paid', cost: '$0.007/email', tag: 'Fast bulk verification.', verticals: 'all' },
      { name: 'Bouncer', kind: 'paid', cost: '$0.007/email', tag: 'Verification with toxicity scoring.', verticals: 'all' },
      { name: 'MillionVerifier', kind: 'paid', cost: '$0.006/email', tag: 'Low-cost bulk verification.', verticals: 'all' },
    ],
  },
  {
    cat: 'Phone',
    items: [
      { name: 'NumVerify', kind: 'free', tag: 'Basic phone format and carrier check (free tier).', verticals: 'all' },
      { name: 'Twilio Lookup', kind: 'paid', cost: '$0.005/number', tag: 'Confirms a number is live and returns carrier and line type.', verticals: 'all' },
      { name: 'Kaspr', kind: 'paid', cost: '$0.07/number', tag: 'Direct dials for named contacts.', verticals: ['B2B Services'] },
      { name: 'Datagma', kind: 'paid', cost: '$0.05/number', tag: 'Phone and email enrichment.', verticals: 'all' },
    ],
  },
  {
    cat: 'Government registries',
    items: [
      { name: 'SAM.gov', kind: 'gov', needsKey: true, getKey: true, tag: 'Federal contractors, entity registrations, and exclusions.', jurisdiction: 'US', rateNote: 'Free, but ~10 lookups/day unless you register an entity account.', verticals: 'all' },
      { name: 'USASpending', kind: 'free', tag: 'Federal award history — who won what, a strong revenue proxy.', jurisdiction: 'US', verticals: 'all' },
      { name: 'SEC EDGAR', kind: 'free', tag: 'Public-company filings, officers, and financials.', jurisdiction: 'US', verticals: ['Financial', 'B2B Services'] },
      { name: 'IRS 990 / ProPublica', kind: 'free', tag: 'Nonprofit officers, compensation, revenue, and EIN.', jurisdiction: 'US', verticals: 'all' },
      { name: 'Secretary of State', kind: 'free', tag: 'Business registrations, officers, and registered agents.', jurisdiction: 'Per state', verticals: 'all' },
      { name: 'OpenCorporates', kind: 'paid', cost: '$0.02/lookup', tag: '230M+ entities across 145 jurisdictions with full provenance. Commercial use needs a paid plan.', jurisdiction: 'Global', verticals: 'all' },
      { name: 'OSHA / DOL', kind: 'free', tag: 'Inspections, violations, and establishment size.', jurisdiction: 'US', verticals: ['Construction', 'Manufacturing'] },
      { name: 'NHTSA vPIC', kind: 'free', tag: 'VIN decode and manufacturer data.', jurisdiction: 'US', verticals: ['Automotive'] },
      { name: 'State Dealer Licenses', kind: 'free', tag: 'Licensed auto dealers and their principals, by state.', jurisdiction: 'Per state', verticals: ['Automotive'] },
      { name: 'Contractor License Boards', kind: 'free', tag: 'License #, status, and qualifying party per state (AZ ROC, CA CSLB…).', jurisdiction: 'Per state', verticals: ['Construction'] },
      { name: 'Building Permits', kind: 'free', tag: 'Names the licensed contractor on every permit filed in a county.', jurisdiction: 'Per county', verticals: ['Construction', 'Real Estate'] },
      { name: 'AGC / ABC / NAHB', kind: 'free', tag: 'Public contractor-association member rosters.', verticals: ['Construction'] },
      { name: 'State Bar', kind: 'free', tag: 'Attorney directories — name, firm, and admission date.', jurisdiction: 'Per state', verticals: ['B2B Services'] },
      { name: 'CPAverify', kind: 'free', tag: 'Licensed CPAs and accounting firms.', jurisdiction: 'Per state', verticals: ['B2B Services', 'Financial'] },
      { name: 'Chamber Directories', kind: 'free', tag: 'Local chamber-of-commerce member rosters.', jurisdiction: 'Per metro', verticals: 'all' },
      { name: 'FINRA BrokerCheck', kind: 'free', tag: 'Registered brokers and firms with disclosures.', jurisdiction: 'US', verticals: ['Financial'] },
      { name: 'SEC IAPD / ADV', kind: 'free', tag: 'Registered investment advisers, AUM, and principals.', jurisdiction: 'US', verticals: ['Financial'] },
      { name: 'NMLS Consumer Access', kind: 'free', tag: 'Mortgage originators and companies by NMLS ID.', jurisdiction: 'US', verticals: ['Financial'] },
      { name: 'State DOI / NAIC', kind: 'free', tag: 'Insurance producer and agency license lookups.', jurisdiction: 'Per state', verticals: ['Financial'] },
      { name: 'FDIC / NCUA', kind: 'free', tag: 'Banks and credit unions with officers and financials.', jurisdiction: 'US', verticals: ['Financial'] },
      { name: 'openFDA', kind: 'free', tag: 'Food facility registrations, recalls, and labeling.', jurisdiction: 'US', verticals: ['CPG & Retail', 'Healthcare'] },
      { name: 'USDA FSIS', kind: 'free', tag: 'Meat and poultry establishment directory.', jurisdiction: 'US', verticals: ['CPG & Retail'] },
      { name: 'TTB', kind: 'free', tag: 'Breweries, wineries, and distillers with owner names.', jurisdiction: 'US', verticals: ['Hospitality', 'CPG & Retail'] },
      { name: 'State Liquor Licenses', kind: 'free', tag: 'Liquor-license holders — often names the owner (AZ DLLC, TX TABC…).', jurisdiction: 'Per state', verticals: ['Hospitality'] },
      { name: 'Health Inspections', kind: 'free', tag: 'County restaurant inspection portals (Socrata / LIVES).', jurisdiction: 'Per county', verticals: ['Hospitality'] },
      { name: 'EPA FRS / ECHO', kind: 'free', tag: 'Facilities, permits, and NAICS with contacts.', jurisdiction: 'US', verticals: ['Manufacturing'] },
      { name: 'FMCSA QCMobile', kind: 'gov', needsKey: true, getKey: true, tag: 'Motor carriers and safety records by name or DOT number.', jurisdiction: 'US', rateNote: 'Free WebKey via Login.gov.', verticals: ['Manufacturing'] },
      { name: 'Census CBP', kind: 'free', tag: 'Plant and firm counts by NAICS and geography.', jurisdiction: 'US', verticals: ['Manufacturing'] },
      { name: 'County Assessor', kind: 'free', tag: 'Parcel ownership and owner mailing address — a direct contact path.', jurisdiction: 'Per county', verticals: ['Real Estate'] },
      { name: 'State RE License', kind: 'free', tag: 'Real estate broker and agent boards (AZ ADRE, CA DRE…).', jurisdiction: 'Per state', verticals: ['Real Estate'] },
      { name: 'HUD / FHFA', kind: 'free', tag: 'Multifamily and assisted-housing property owners.', jurisdiction: 'US', verticals: ['Real Estate'] },
      { name: 'NPI Registry', kind: 'free', tag: 'Every licensed US healthcare provider, by name and specialty.', jurisdiction: 'US', verticals: ['Healthcare'] },
      { name: 'CMS Provider Data', kind: 'free', tag: 'Care Compare and Open Payments — names individual physicians.', jurisdiction: 'US', verticals: ['Healthcare'] },
      { name: 'SAMHSA Locator', kind: 'free', tag: 'Behavioral-health treatment facilities and services.', jurisdiction: 'US', verticals: ['Healthcare'] },
      { name: 'State Health Licenses', kind: 'free', tag: 'Facility and clinician licensing boards.', jurisdiction: 'Per state', verticals: ['Healthcare'] },
      { name: 'Medicaid Provider Directories', kind: 'free', tag: 'Per-state enrolled-provider lists.', jurisdiction: 'Per state', verticals: ['Healthcare'] },
    ],
  },
  {
    cat: 'Property & parcel',
    items: [
      { name: 'ATTOM', kind: 'paid', cost: '$0.04/parcel', tag: 'Parcel and property data where free county coverage is patchy.', verticals: ['Real Estate'] },
      { name: 'Regrid', kind: 'paid', cost: '$0.03/parcel', tag: 'Nationwide parcel boundaries and owner data.', verticals: ['Real Estate'] },
    ],
  },
  {
    cat: 'Local & places',
    items: [
      { name: 'Yelp Fusion', kind: 'paid', cost: '$0.01/lookup', tag: 'Local business listings, hours, and reviews.', verticals: 'all' },
      { name: 'Foursquare', kind: 'paid', cost: '$0.01/lookup', tag: 'Places data and category tagging.', verticals: 'all' },
      { name: 'Outscraper', kind: 'paid', cost: '$0.02/lookup', tag: 'Google Maps data at volume.', verticals: 'all' },
    ],
  },
  {
    cat: 'CRM & delivery',
    items: [
      { name: 'Pipedrive', kind: 'free', tag: 'Push deals and activity notes on first sync.', verticals: 'all' },
      { name: 'HubSpot', kind: 'free', tag: 'Sync contacts and notes.', verticals: 'all' },
      { name: 'Salesforce', kind: 'free', tag: 'Leads and opportunities.', verticals: ['B2B Services', 'Financial'] },
      { name: 'ActiveCampaign', kind: 'free', tag: 'Contacts and tags.', verticals: 'all' },
      { name: 'Close', kind: 'free', tag: 'Leads and calling for inside sales.', verticals: ['B2B Services'] },
      { name: 'Instantly', kind: 'free', tag: 'Cold-email sending and sequencing.', verticals: 'all' },
      { name: 'Smartlead', kind: 'free', tag: 'Cold-email sending at scale.', verticals: 'all' },
      { name: 'Webhook', kind: 'builtin', tag: 'Post results to any endpoint you control.', verticals: 'all' },
      { name: 'CSV Export', kind: 'builtin', tag: 'Download a spreadsheet of qualified contacts.', verticals: 'all' },
    ],
  },
];

export const AI_PROVIDERS: ProviderCategory = {
  cat: 'AI',
  items: [
    { name: 'Anthropic', kind: 'ai', tag: 'Runs extraction, scoring, and outreach drafting on Claude (Fable 5 · Sonnet · Haiku).', verticals: 'all' },
    { name: 'OpenAI', kind: 'ai', tag: 'GPT-4o as an alternate model for extraction and scoring.', verticals: 'all' },
    { name: 'Gemini', kind: 'ai', tag: 'Google Gemini 2.5 as an alternate model.', verticals: 'all' },
  ],
};

export const VERTICALS = [
  'Automotive',
  'B2B Services',
  'Construction',
  'CPG & Retail',
  'Financial',
  'Hospitality',
  'Manufacturing',
  'Real Estate',
  'Healthcare',
] as const;

/** Flatten the catalog into a lookup by provider name. */
export function providerByName(name: string): ProviderDef | undefined {
  for (const cat of PROVIDER_CATALOG) {
    const hit = cat.items.find((i) => i.name === name);
    if (hit) return hit;
  }
  return AI_PROVIDERS.items.find((i) => i.name === name);
}

/** Parse a `$0.04/lookup` cost string into a per-call USD number. */
export function parseCost(cost?: string): number {
  if (!cost) return 0;
  const m = cost.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}
