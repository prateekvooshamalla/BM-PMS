export type QualityLevel = 'basic' | 'standard' | 'premium';
export type PropertyType = 'independent_house' | 'duplex' | 'villa';
export type WallType = 'red_brick' | 'aac_block';
export type FoundationType = 'standard' | 'soft_soil' | 'rocky';
export type SlabType = 'rcc_flat' | 'rcc_premium';
export type WaterSource = 'municipal' | 'tanker' | 'borewell' | 'mixed';
export type PlumbingTier = 'economy' | 'standard' | 'premium';
export type SewageType = 'septic' | 'municipal';
export type ElectricalTier = 'economy' | 'standard' | 'premium';
export type UserRole = 'owner' | 'admin' | 'contractor';

export interface ProjectInput {
  projectName: string;
  location: string;
  builtUpSft: number;
  floors: number;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  qualityLevel: QualityLevel;
  wallType: WallType;
  foundationType: FoundationType;
  slabType: SlabType;
  ceilingHeightFt: number;
  includeCompoundWall: boolean;
  includeSump: boolean;
  includeSepticTank: boolean;
  includeBorewell: boolean;
  vastuPriority: boolean;
  parking: boolean;
  kitchenCount: number;
  utilityPoints: number;
  balconyCount: number;
  waterSource: WaterSource;
  sewageType: SewageType;
  plumbingTier: PlumbingTier;
  electricalTier: ElectricalTier;
  overheadTankLitres: number;
}

export interface SummaryCard { label: string; value: string; }
export interface CostLineItem { category: string; amount: number; percentage: number; }
export interface MaterialItem { name: string; unit: string; quantity: number; rate: number; amount: number; note?: string; stage?: string; source?: 'manual' | 'market' | 'hybrid'; }
export interface LabourItem { labourType: string; stage: string; count: number; days: number; ratePerDay: number; totalCost: number; deploymentWindow: string; }
export interface PhaseItem { id: string; name: string; durationDays: number; startDay: number; endDay: number; dependencies: string[]; deliverables: string[]; }
export interface TaskItem { id: string; phaseId: string; phaseName: string; name: string; owner: string; durationDays: number; status: 'todo' | 'in_progress' | 'blocked' | 'done'; materials: string[]; dependencyTaskIds?: string[]; qaCheckpoint?: string; }
export interface InsightBlock { title: string; points: string[]; }

export interface WaterPlanItem {
  stage: string;
  useCase: string;
  litresPerDay: number;
  days: number;
  totalLitres: number;
  recommendedSource: WaterSource;
  notes: string;
}

export interface PlumbingFixtureItem {
  code: string;
  name: string;
  unit: string;
  quantity: number;
  category: 'fixtures' | 'pipes' | 'valves' | 'drainage' | 'tools';
  selectionGuide: string;
  inspectionPoint: string;
  installStage: string;
}

export interface ElectricalPointItem {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  stage: string;
  recommendation: string;
  qaCheck: string;
}

export interface ProcurementItem {
  id: string;
  stage: string;
  itemGroup: string;
  triggerDay: number;
  quantityHint: string;
  whyNow: string;
  holdPoint: string;
}

export interface QualityCheckItem {
  title: string;
  trade: string;
  whyItMatters: string;
  checkWhen: string;
  howToVerify: string;
}

export interface AIAnalysis {
  status: 'idle' | 'ready' | 'error';
  summary: string;
  risks: string[];
  opportunities: string[];
  procurementNotes: string[];
  paymentReleaseChecks: string[];
  locationInsights?: string[];
  plumbingInsights?: string[];
  electricalInsights?: string[];
  ownerQuestions?: string[];
}

export interface EstimateResult {
  summary: SummaryCard[];
  totalCost: number;
  costPerSft: number;
  breakdown: CostLineItem[];
  materials: MaterialItem[];
  labour: LabourItem[];
  phases: PhaseItem[];
  tasks: TaskItem[];
  insights: InsightBlock[];
  assumptions: string[];
  waterPlan: WaterPlanItem[];
  plumbingPlan: PlumbingFixtureItem[];
  electricalPlan: ElectricalPointItem[];
  procurementPlan: ProcurementItem[];
  qualityChecks: QualityCheckItem[];
  aiAnalysis?: AIAnalysis;
}

export interface CityRate {
  id: string;
  city: string;
  state?: string;
  locationFactor: number;
  labourFactor: number;
  transportFactor: number;
  waterCostPer1000L?: number;
  tankerAvailability?: 'low' | 'medium' | 'high';
  typicalWaterSource?: WaterSource;
}

export interface MaterialRate {
  id: string;
  name: string;
  unit: string;
  baseRate: number;
}

export interface LabourRate {
  id: string;
  labourType: string;
  ratePerDay: number;
}

export interface AnalysisReport {
  id?: string;
  projectId?: string;
  projectName: string;
  location: string;
  summary: string;
  risks: string[];
  opportunities: string[];
  createdAt?: string;
}

export interface ProjectRecord {
  id?: string;
  ownerId?: string;
  input: ProjectInput;
  estimate: EstimateResult;
  createdAt?: string;
}

export interface AnalyzeProjectRequest {
  input: ProjectInput;
  estimate: EstimateResult;
}

export type PriceSourceMode = 'manual' | 'market' | 'hybrid';

export interface MarketPriceItem {
  materialId: string;
  materialName: string;
  suggestedRate: number;
  unit: string;
  lowRate?: number;
  highRate?: number;
  rationale: string;
  sources: { title: string; url: string }[];
  refreshedAt?: string;
}

export interface MarketPriceResponse {
  city: string;
  sourceMode: PriceSourceMode;
  items: MarketPriceItem[];
  notes: string[];
}

export interface VendorQuoteItem {
  category: 'civil' | 'steel' | 'plumbing' | 'electrical' | 'finishing' | 'labour';
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  note?: string;
}

export interface VendorQuote {
  id?: string;
  vendorName: string;
  location: string;
  validityDays: number;
  gstIncluded: boolean;
  paymentTerms: string;
  timelineDays: number;
  items: VendorQuoteItem[];
  createdAt?: string;
}

export interface QuoteComparisonResult {
  status: 'ready' | 'error';
  summary: string;
  bestValueVendor: string;
  cheapestVendor: string;
  fastestVendor: string;
  negotiationPoints: string[];
  redFlags: string[];
  scopeGaps: string[];
}

export interface CompareQuotesRequest {
  project: ProjectInput;
  estimate: EstimateResult;
  quotes: VendorQuote[];
}

export interface SiteObservationInput {
  projectName: string;
  location: string;
  phase: string;
  observationNotes: string;
  imageUrl?: string;
  checklist: string[];
}

export interface SiteObservationResult {
  status: 'ready' | 'error';
  summary: string;
  urgentIssues: string[];
  nextChecks: string[];
  workerInstructions: string[];
  paymentHoldPoints: string[];
}

export interface BrandCatalogItem {
  id: string;
  category: 'cement' | 'steel' | 'plumbing' | 'electrical' | 'paint' | 'tiles' | 'waterproofing';
  brand: string;
  productLine: string;
  positioning: 'value' | 'balanced' | 'premium';
  whyPopular: string;
  bestFor: string;
  notes: string[];
}

export interface FloorPlanRoom {
  name: string;
  count: number;
  approximateAreaSft?: number;
}

export interface FloorPlanMaterialHint {
  material: string;
  deltaPercentage: number;
  rationale: string;
}

export interface FloorPlanAnalysisResult {
  status: 'ready' | 'error';
  summary: string;
  builtUpSftRange: { min: number; max: number };
  inferredRooms: FloorPlanRoom[];
  inferredBathrooms: number;
  inferredBalconies: number;
  inferredKitchenCount: number;
  plumbingFixtures: { item: string; quantity: number; note: string }[];
  materialAdjustments: FloorPlanMaterialHint[];
  boqHints?: { category: string; item: string; basis: string; quantityHint: string; note: string }[];
  followUpQuestions: string[];
  assumptions: string[];
}


export interface UserProfile {
  uid: string;
  phoneNumber: string;
  role: UserRole;
  status: 'active' | 'disabled';
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface VerifiedPriceEntry {
  id: string;
  cityId: string;
  materialId: string;
  materialName: string;
  unit: string;
  supplierName: string;
  rate: number;
  quoteDate: string;
  validityDays?: number;
  sourceType: 'supplier_quote' | 'dealer_call' | 'invoice' | 'site_purchase';
  note?: string;
}
