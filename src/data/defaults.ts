import { BrandCatalogItem, CityRate, LabourRate, MaterialRate, ProjectInput } from '../types';

export const emptyProjectInput: ProjectInput = {
  projectName: '',
  location: '',
  builtUpSft: 0,
  floors: 1,
  propertyType: 'independent_house',
  bedrooms: 2,
  bathrooms: 2,
  qualityLevel: 'standard',
  wallType: 'red_brick',
  foundationType: 'standard',
  slabType: 'rcc_flat',
  ceilingHeightFt: 10,
  includeCompoundWall: false,
  includeSump: false,
  includeSepticTank: false,
  includeBorewell: false,
  vastuPriority: true,
  parking: false,
  kitchenCount: 1,
  utilityPoints: 1,
  balconyCount: 0,
  waterSource: 'municipal',
  sewageType: 'municipal',
  plumbingTier: 'standard',
  electricalTier: 'standard',
  overheadTankLitres: 1500,
};

export const defaultCities: CityRate[] = [
  { id: 'hyderabad', city: 'Hyderabad', state: 'Telangana', locationFactor: 1, labourFactor: 1, transportFactor: 1, waterCostPer1000L: 180, tankerAvailability: 'high', typicalWaterSource: 'mixed' },
  { id: 'warangal', city: 'Warangal', state: 'Telangana', locationFactor: 0.94, labourFactor: 0.91, transportFactor: 1.02, waterCostPer1000L: 160, tankerAvailability: 'medium', typicalWaterSource: 'municipal' },
  { id: 'vijayawada', city: 'Vijayawada', state: 'Andhra Pradesh', locationFactor: 0.97, labourFactor: 0.95, transportFactor: 1.01, waterCostPer1000L: 150, tankerAvailability: 'medium', typicalWaterSource: 'municipal' },
  { id: 'bengaluru', city: 'Bengaluru', state: 'Karnataka', locationFactor: 1.08, labourFactor: 1.1, transportFactor: 1.04, waterCostPer1000L: 210, tankerAvailability: 'high', typicalWaterSource: 'tanker' },
  { id: 'mumbai', city: 'Mumbai', state: 'Maharashtra', locationFactor: 1.15, labourFactor: 1.16, transportFactor: 1.06, waterCostPer1000L: 260, tankerAvailability: 'high', typicalWaterSource: 'municipal' },
];

export const defaultMaterialRates: MaterialRate[] = [
  { id: 'cement', name: 'Cement', unit: 'bags', baseRate: 420 },
  { id: 'steel', name: 'Steel', unit: 'kg', baseRate: 68 },
  { id: 'sand', name: 'Sand', unit: 'cft', baseRate: 55 },
  { id: 'aggregate', name: 'Aggregate', unit: 'cft', baseRate: 48 },
  { id: 'brick', name: 'Bricks / Blocks', unit: 'nos', baseRate: 10 },
  { id: 'cpvc', name: 'CPVC Pipes & Fittings', unit: 'lot', baseRate: 48000 },
  { id: 'upvc', name: 'UPVC Drainage', unit: 'lot', baseRate: 36000 },
  { id: 'sanitary', name: 'Sanitary & CP Fittings', unit: 'lot', baseRate: 95000 },
  { id: 'electrical', name: 'Electrical Package', unit: 'lot', baseRate: 115000 },
  { id: 'wire', name: 'Wires & Cables', unit: 'coil', baseRate: 3800 },
  { id: 'switches', name: 'Switches & Plates', unit: 'lot', baseRate: 32000 },
  { id: 'flooring', name: 'Tiles & Flooring', unit: 'sft', baseRate: 110 },
  { id: 'paint', name: 'Paint', unit: 'lot', baseRate: 85000 },
  { id: 'waterproofing', name: 'Waterproofing', unit: 'lot', baseRate: 54000 },
];

export const defaultLabourRates: LabourRate[] = [
  { id: 'supervisor', labourType: 'Site Supervisor', ratePerDay: 1800 },
  { id: 'mason', labourType: 'Masons', ratePerDay: 1200 },
  { id: 'helper', labourType: 'Helpers', ratePerDay: 700 },
  { id: 'bar-bender', labourType: 'Bar Benders', ratePerDay: 1300 },
  { id: 'carpenter', labourType: 'Shuttering Carpenters', ratePerDay: 1350 },
  { id: 'electrician', labourType: 'Electricians', ratePerDay: 1500 },
  { id: 'plumber', labourType: 'Plumbers', ratePerDay: 1500 },
  { id: 'painter', labourType: 'Painters', ratePerDay: 1100 },
  { id: 'waterproofing', labourType: 'Waterproofing Crew', ratePerDay: 1500 },
  { id: 'tiler', labourType: 'Tile Layers', ratePerDay: 1250 },
];

export const popularBrands: BrandCatalogItem[] = [
  { id: 'ultratech-cement', category: 'cement', brand: 'UltraTech', productLine: 'OPC / PPC', positioning: 'balanced', whyPopular: 'Widely available and commonly quoted by residential contractors.', bestFor: 'General RCC and masonry work with easy sourcing.', notes: ['Check bag freshness and batch date.', 'Do not accept torn bags or mixed brands in one pour.'] },
  { id: 'dalmia-cement', category: 'cement', brand: 'Dalmia', productLine: 'DSP / PPC', positioning: 'premium', whyPopular: 'Often preferred for stronger brand confidence in urban owner-build projects.', bestFor: 'Owner-supervised sites where batch consistency matters.', notes: ['Match invoice brand and delivered brand.', 'Store on pallets away from moisture.'] },
  { id: 'vizag-steel', category: 'steel', brand: 'Vizag Steel', productLine: 'TMT bars', positioning: 'balanced', whyPopular: 'Common reference brand for TMT comparison.', bestFor: 'RCC works where traceability and diameter marking are checked.', notes: ['Insist on diameter-wise bill.', 'Weigh bundles randomly at site.'] },
  { id: 'tata-tiscon', category: 'steel', brand: 'Tata Tiscon', productLine: 'TMT bars', positioning: 'premium', whyPopular: 'Frequently selected when owner wants stronger branded assurance.', bestFor: 'Premium or heavily supervised builds.', notes: ['Verify bar embossing.', 'Avoid mixed bundles from different plants.'] },
  { id: 'ashirvad-plumbing', category: 'plumbing', brand: 'Ashirvad', productLine: 'CPVC / SWR', positioning: 'premium', whyPopular: 'Strong acceptance for plumbing and drainage lines.', bestFor: 'Concealed plumbing where reliability matters more than lowest cost.', notes: ['Match pressure class to application.', 'Pressure test before wall closure.'] },
  { id: 'astral-plumbing', category: 'plumbing', brand: 'Astral', productLine: 'CPVC / UPVC', positioning: 'balanced', whyPopular: 'Very commonly available with strong dealer network.', bestFor: 'Standard budget homes wanting easier replacement sourcing.', notes: ['Ask for full fitting list, not just pipe length.', 'Check solvent and fitting compatibility.'] },
  { id: 'finolex-electrical', category: 'electrical', brand: 'Finolex', productLine: 'Wires and cables', positioning: 'balanced', whyPopular: 'Commonly used in residential wiring with broad availability.', bestFor: 'Standard home electrical packages.', notes: ['Check coil length and gauge.', 'Keep separate circuit labels during laying.'] },
  { id: 'polycab-electrical', category: 'electrical', brand: 'Polycab', productLine: 'Wires and cables', positioning: 'premium', whyPopular: 'Popular for higher confidence in internal wiring.', bestFor: 'Premium electrical packages and heavier point density.', notes: ['Never allow coil substitution after approval.', 'Ask for point-wise wire schedule.'] },
  { id: 'asian-paints', category: 'paint', brand: 'Asian Paints', productLine: 'Interior and exterior systems', positioning: 'balanced', whyPopular: 'Most commonly shortlisted in residential finishing.', bestFor: 'Projects needing predictable finish and service network.', notes: ['Demand primer + putty + finish system on estimate.', 'Check dilution practices on site.'] },
  { id: 'kajaria-tiles', category: 'tiles', brand: 'Kajaria', productLine: 'Floor and wall tiles', positioning: 'balanced', whyPopular: 'Frequently cited for wide range and availability.', bestFor: 'Main floors and bathrooms with consistent shade control.', notes: ['Buy extra boxes from same batch.', 'Check shade and calibre before laying.'] },
  { id: 'dr-fixit-waterproofing', category: 'waterproofing', brand: 'Dr. Fixit', productLine: 'Roof, toilet and wall waterproofing', positioning: 'premium', whyPopular: 'Common owner-requested waterproofing brand.', bestFor: 'Wet areas, terraces, and repair-sensitive zones.', notes: ['Follow full system, not isolated chemical use.', 'Water test before tiling or top finish.'] },
];
