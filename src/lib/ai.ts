import { httpsCallable } from 'firebase/functions';
import {
  AnalyzeProjectRequest,
  AIAnalysis,
  CompareQuotesRequest,
  FloorPlanAnalysisResult,
  MarketPriceResponse,
  MaterialRate,
  PriceSourceMode,
  QuoteComparisonResult,
  SiteObservationInput,
  SiteObservationResult,
} from '../types';
import { functions } from './firebase';

export async function analyzeProjectWithAI(payload: AnalyzeProjectRequest): Promise<AIAnalysis> {
  const fn = httpsCallable<AnalyzeProjectRequest, AIAnalysis>(functions, 'analyzeProject', { timeout: 120000 });
  const result = await fn(payload);
  return result.data;
}

export async function refreshMarketRatesWithAI(params: {
  city: string;
  state?: string;
  materials: MaterialRate[];
  sourceMode: PriceSourceMode;
}): Promise<MarketPriceResponse> {
  const fn = httpsCallable<typeof params, MarketPriceResponse>(functions, 'refreshMarketRates', { timeout: 120000 });
  const result = await fn(params);
  return result.data;
}

export async function compareVendorQuotesWithAI(payload: CompareQuotesRequest): Promise<QuoteComparisonResult> {
  const fn = httpsCallable<CompareQuotesRequest, QuoteComparisonResult>(functions, 'compareVendorQuotes', { timeout: 120000 });
  const result = await fn(payload);
  return result.data;
}

export async function reviewSiteObservationWithAI(payload: SiteObservationInput): Promise<SiteObservationResult> {
  const fn = httpsCallable<SiteObservationInput, SiteObservationResult>(functions, 'reviewSiteObservation', { timeout: 120000 });
  const result = await fn(payload);
  return result.data;
}

export async function analyzeFloorPlanWithAI(payload: { imageDataUrl: string; projectName: string; location: string; notes?: string; }): Promise<FloorPlanAnalysisResult> {
  const fn = httpsCallable<typeof payload, FloorPlanAnalysisResult>(functions, 'analyzeFloorPlan', { timeout: 120000 });
  const result = await fn(payload);
  return result.data;
}
