import { defaultCities, defaultLabourRates, defaultMaterialRates } from '../data/defaults';
import {
  AIAnalysis,
  CityRate,
  ElectricalPointItem,
  EstimateResult,
  InsightBlock,
  LabourItem,
  LabourRate,
  MaterialItem,
  MaterialRate,
  PhaseItem,
  PlumbingFixtureItem,
  ProcurementItem,
  ProjectInput,
  QualityCheckItem,
  QualityLevel,
  TaskItem,
  WaterPlanItem,
  WaterSource,
} from '../types';
import { inr, titleize } from './utils';

const qualityRateMap: Record<QualityLevel, number> = { basic: 1750, standard: 2150, premium: 2850 };
const qualityFactorMap: Record<QualityLevel, number> = { basic: 0.92, standard: 1, premium: 1.18 };
const plumbingTierFactor = { economy: 0.85, standard: 1, premium: 1.35 };
const electricalTierFactor = { economy: 0.88, standard: 1, premium: 1.28 };

const rateOf = <T extends { id: string }>(rows: T[], id: string, fallbackRows: T[]) => rows.find((r) => r.id === id) ?? fallbackRows.find((r) => r.id === id)!;
const findCity = (rows: CityRate[], name: string) => rows.find((row) => name.toLowerCase().includes(row.city.toLowerCase())) ?? defaultCities[0];
const foundationFactor = (type: ProjectInput['foundationType']) => (type === 'soft_soil' ? 1.1 : type === 'rocky' ? 1.06 : 1);
const wallFactor = (type: ProjectInput['wallType']) => (type === 'aac_block' ? 0.96 : 1);
const slabFactor = (type: ProjectInput['slabType']) => (type === 'rcc_premium' ? 1.05 : 1);

function extraCost(input: ProjectInput) {
  let extras = 0;
  if (input.includeCompoundWall) extras += 180000;
  if (input.includeSump) extras += 60000;
  if (input.includeSepticTank) extras += 85000;
  if (input.includeBorewell) extras += 120000;
  if (input.parking) extras += 90000;
  return extras;
}

function getWaterSource(city: CityRate, input: ProjectInput): WaterSource {
  if (input.includeBorewell && input.waterSource === 'mixed') return 'mixed';
  return input.waterSource || city.typicalWaterSource || 'municipal';
}

function createWaterPlan(input: ProjectInput, city: CityRate): WaterPlanItem[] {
  const areaFactor = input.builtUpSft / 1000;
  const source = getWaterSource(city, input);
  const rows: Omit<WaterPlanItem, 'totalLitres'>[] = [
    { stage: 'Foundation', useCase: 'Excavation damping, PCC, footing concrete', litresPerDay: Math.round(2200 * areaFactor), days: 6, recommendedSource: source, notes: 'Keep storage ready before concrete day. Foundation crews should not stop for tanker delay.' },
    { stage: 'RCC Structure', useCase: 'Column, beam, slab casting and curing', litresPerDay: Math.round(3200 * areaFactor), days: 14, recommendedSource: source, notes: 'Peak water demand happens at slab casting plus 7 to 10 days of curing.' },
    { stage: 'Masonry', useCase: 'Brick or block conditioning and wall curing', litresPerDay: Math.round(1800 * areaFactor), days: 12, recommendedSource: source, notes: input.wallType === 'aac_block' ? 'AAC blocks need controlled wetting, not heavy soaking.' : 'Red bricks should be wetted before use, but not muddy.' },
    { stage: 'Plastering', useCase: 'Surface prep and plaster curing', litresPerDay: Math.round(2100 * areaFactor), days: 10, recommendedSource: source, notes: 'Insufficient curing often causes cracks that appear only after painting.' },
    { stage: 'Flooring & Finishing', useCase: 'Tile bedding, cleaning, waterproofing tests', litresPerDay: Math.round(1200 * areaFactor), days: 8, recommendedSource: source, notes: 'Reserve separate water for toilet pond tests and terrace checks.' },
  ];
  return rows.map((row) => ({ ...row, totalLitres: row.litresPerDay * row.days }));
}

function createPlumbingPlan(input: ProjectInput): PlumbingFixtureItem[] {
  const bathrooms = input.bathrooms;
  const kitchens = input.kitchenCount;
  const outdoorTaps = Math.max(2, input.balconyCount + input.utilityPoints);
  const floorDrains = bathrooms + kitchens + input.utilityPoints;
  const washingMachinePoints = Math.max(1, input.utilityPoints);
  const hotWaterPoints = bathrooms + kitchens;
  const mainPipeMeters = Math.ceil(input.builtUpSft / 8);
  const internalPipeMeters = Math.ceil(input.builtUpSft / 4.5);

  return [
    { code: 'WC', name: 'Western Closet', unit: 'nos', quantity: bathrooms, category: 'fixtures', selectionGuide: 'Choose branded trap and soft-close seat. Confirm rough-in distance before purchase.', inspectionPoint: 'Check centerline, trap seal, and flush pressure before fixing.', installStage: 'Finishing' },
    { code: 'WB', name: 'Wash Basin', unit: 'nos', quantity: bathrooms, category: 'fixtures', selectionGuide: 'Pick depth that reduces splash and confirm bottle trap or pedestal detail.', inspectionPoint: 'Verify drain slope and hot-cold alignment.', installStage: 'Finishing' },
    { code: 'SH', name: 'Shower Mixer / Diverter', unit: 'nos', quantity: bathrooms, category: 'fixtures', selectionGuide: 'Use concealed body only from a brand with spare-part support.', inspectionPoint: 'Pressure test before tiles and verify hot-cold orientation.', installStage: 'MEP rough-in + Finishing' },
    { code: 'HF', name: 'Health Faucet', unit: 'nos', quantity: bathrooms, category: 'fixtures', selectionGuide: 'Check braided hose quality and wall bracket strength.', inspectionPoint: 'Check leak-free joints after 24-hour pressure hold.', installStage: 'Finishing' },
    { code: 'KS', name: 'Kitchen Sink', unit: 'nos', quantity: kitchens, category: 'fixtures', selectionGuide: 'Select stainless gauge and waste coupling before deciding cutout size.', inspectionPoint: 'Check drain trap access and mixer reach.', installStage: 'Finishing' },
    { code: 'OT', name: 'Outdoor / Utility Tap', unit: 'nos', quantity: outdoorTaps, category: 'fixtures', selectionGuide: 'Use heavy-duty bib cocks at terrace, utility, and garden points.', inspectionPoint: 'Avoid loose wall fixing or fake chrome plating.', installStage: 'Finishing' },
    { code: 'FD', name: 'Floor Drain', unit: 'nos', quantity: floorDrains, category: 'drainage', selectionGuide: 'Choose anti-cockroach trap models in wet areas.', inspectionPoint: 'Confirm tile slope directs water fully into drain.', installStage: 'Flooring' },
    { code: 'WM', name: 'Washing Machine Inlet/Outlet', unit: 'set', quantity: washingMachinePoints, category: 'fixtures', selectionGuide: 'Keep dedicated point near utility with service valve.', inspectionPoint: 'Verify height and waste trap placement before tiles.', installStage: 'MEP rough-in + Finishing' },
    { code: 'CPVC', name: 'CPVC Hot/Cold Water Pipes', unit: 'm', quantity: internalPipeMeters, category: 'pipes', selectionGuide: 'Do not mix brands or pressure classes on concealed lines.', inspectionPoint: 'Insist on pressure test before plastering.', installStage: 'MEP rough-in' },
    { code: 'UPVC', name: 'UPVC Soil/Waste Pipes', unit: 'm', quantity: mainPipeMeters, category: 'pipes', selectionGuide: 'Use proper bends, access doors, and correct slope.', inspectionPoint: 'Check solvent joints, clamp spacing, and venting.', installStage: 'MEP rough-in' },
    { code: 'GV', name: 'Gate / Ball Valves', unit: 'nos', quantity: Math.max(6, bathrooms + kitchens + 3), category: 'valves', selectionGuide: 'Provide isolating valves by toilet block and tank feed.', inspectionPoint: 'Confirm handle quality and ease of servicing.', installStage: 'MEP rough-in' },
    { code: 'PT', name: 'Plumber Tool Kit', unit: 'set', quantity: 1, category: 'tools', selectionGuide: 'Require pressure pump, pipe cutter, threading tools, and laser level.', inspectionPoint: 'Do not allow concealed piping without test pump on site.', installStage: 'Pre-construction' },
    { code: 'HWP', name: 'Hot Water Provision Points', unit: 'nos', quantity: hotWaterPoints, category: 'fixtures', selectionGuide: 'Provide dedicated geyser provision with service valves.', inspectionPoint: 'Check separation of hot and cold lines in chases.', installStage: 'MEP rough-in' },
  ];
}

function createElectricalPlan(input: ProjectInput): ElectricalPointItem[] {
  const bedrooms = input.bedrooms;
  const bathrooms = input.bathrooms;
  const fans = bedrooms + 2 + input.balconyCount;
  const lightPoints = Math.round(input.builtUpSft / 80) + bathrooms + input.utilityPoints;
  const socketPoints = bedrooms * 4 + input.kitchenCount * 6 + input.utilityPoints * 2 + 6;
  const acPoints = bedrooms + 1;
  const geyserPoints = bathrooms;
  const cctvPoints = Math.max(2, input.balconyCount + 2);

  return [
    { code: 'LT', name: 'Light Points', quantity: lightPoints, unit: 'nos', stage: 'Electrical rough-in', recommendation: 'Freeze lighting layout room by room before slab chase or wall chasing.', qaCheck: 'Count actual points on marked walls, not just in contractor BOQ.' },
    { code: 'SK', name: '5A/6A Socket Points', quantity: socketPoints, unit: 'nos', stage: 'Electrical rough-in', recommendation: 'Keep extra sockets at TV wall, bedside, kitchen counter, and study niche.', qaCheck: 'Check switchboard height and socket polarity before plate fixing.' },
    { code: 'FN', name: 'Fan Points', quantity: fans, unit: 'nos', stage: 'RCC + rough-in', recommendation: 'Fan hooks and fan boxes should be aligned before plastering.', qaCheck: 'Verify fan box anchoring, not just loose clamp wire.' },
    { code: 'AC', name: 'AC Power + Drain Points', quantity: acPoints, unit: 'nos', stage: 'Electrical + plumbing rough-in', recommendation: 'Give dedicated MCB and drain sleeve for each AC location.', qaCheck: 'Photograph conduit and drain sleeve before wall closure.' },
    { code: 'GY', name: 'Geyser Points', quantity: geyserPoints, unit: 'nos', stage: 'Electrical + plumbing rough-in', recommendation: 'Use proper load cable and separate switch outside wet zone.', qaCheck: 'Insist on earthing continuity test.' },
    { code: 'DB', name: 'Distribution Board', quantity: 1, unit: 'set', stage: 'Finishing', recommendation: 'Use branded MCB/RCCB with clear circuit schedule.', qaCheck: 'Match every circuit label to actual room/service.' },
    { code: 'ELV', name: 'CCTV / Internet / Bell / Inverter Provisions', quantity: cctvPoints + 3, unit: 'nos', stage: 'Electrical rough-in', recommendation: 'Keep low-voltage conduits separated from power lines.', qaCheck: 'Do continuity test before plastering.' },
  ];
}

function labourRate(labourRates: LabourRate[], id: string) {
  return rateOf(labourRates, id, defaultLabourRates).ratePerDay;
}

function createLabour(input: ProjectInput, labourRates: LabourRate[], city: CityRate): LabourItem[] {
  const areaFactor = input.builtUpSft / 1000;
  const multiplier = input.floors > 1 ? 1.15 : 1;
  const lf = city.labourFactor;
  const rows: Omit<LabourItem, 'totalCost'>[] = [
    { labourType: 'Site Supervisor', stage: 'Pre-construction', count: 1, days: 12, ratePerDay: labourRate(labourRates, 'supervisor') * lf, deploymentWindow: 'Day 1-12' },
    { labourType: 'Excavation Team', stage: 'Foundation', count: Math.ceil(4 * areaFactor), days: 4, ratePerDay: 900 * lf, deploymentWindow: 'Day 4-8' },
    { labourType: 'Masons', stage: 'Foundation + Brickwork', count: Math.ceil(3 * areaFactor * multiplier), days: 30, ratePerDay: labourRate(labourRates, 'mason') * lf, deploymentWindow: 'Day 8-42' },
    { labourType: 'Helpers', stage: 'Core civil works', count: Math.ceil(5 * areaFactor * multiplier), days: 38, ratePerDay: labourRate(labourRates, 'helper') * lf, deploymentWindow: 'Day 8-47' },
    { labourType: 'Bar Benders', stage: 'RCC works', count: Math.ceil(2 * areaFactor), days: 10, ratePerDay: labourRate(labourRates, 'bar-bender') * lf, deploymentWindow: 'Day 10-22' },
    { labourType: 'Shuttering Carpenters', stage: 'RCC works', count: Math.ceil(3 * areaFactor), days: 12, ratePerDay: labourRate(labourRates, 'carpenter') * lf, deploymentWindow: 'Day 10-24' },
    { labourType: 'Plumbers', stage: 'MEP rough-in + fittings', count: Math.max(1, Math.ceil(areaFactor)), days: 14, ratePerDay: labourRate(labourRates, 'plumber') * lf, deploymentWindow: 'Day 32-62' },
    { labourType: 'Electricians', stage: 'MEP rough-in + fittings', count: Math.max(1, Math.ceil(areaFactor)), days: 13, ratePerDay: labourRate(labourRates, 'electrician') * lf, deploymentWindow: 'Day 34-64' },
    { labourType: 'Waterproofing Crew', stage: 'Toilets + terraces', count: Math.max(1, Math.ceil(areaFactor)), days: 6, ratePerDay: labourRate(labourRates, 'waterproofing') * lf, deploymentWindow: 'Day 46-54' },
    { labourType: 'Tile Layers', stage: 'Flooring', count: Math.ceil(2 * areaFactor), days: 10, ratePerDay: labourRate(labourRates, 'tiler') * lf, deploymentWindow: 'Day 55-68' },
    { labourType: 'Painters', stage: 'Finishing', count: Math.ceil(3 * areaFactor), days: 12, ratePerDay: labourRate(labourRates, 'painter') * lf, deploymentWindow: 'Day 64-78' },
  ];
  return rows.map((row) => ({ ...row, ratePerDay: Math.round(row.ratePerDay), totalCost: Math.round(row.count * row.days * row.ratePerDay) }));
}

function createPhases(input: ProjectInput): PhaseItem[] {
  const baseDuration = Math.max(80, Math.round(input.builtUpSft / 33));
  const phaseSeed = [
    ['p1', 'Planning & Site Prep', 7, [], ['Scope freeze', 'Site marking', 'Mobilization']],
    ['p2', 'Foundation', 12, ['p1'], ['Excavation', 'Footings', 'Columns to plinth']],
    ['p3', 'RCC Structure', 16, ['p2'], ['Plinth beam', 'Columns', 'Slab casting']],
    ['p4', 'Masonry', 14, ['p3'], ['External walls', 'Internal partitions']],
    ['p5', 'Electrical & Plumbing Rough-ins', 10, ['p4'], ['Conduits', 'CPVC/UPVC lines', 'Pressure tests']],
    ['p6', 'Plastering', 10, ['p5'], ['Internal plaster', 'External plaster']],
    ['p7', 'Waterproofing & Flooring', 10, ['p6'], ['Wet-area membranes', 'Tiles', 'Slope checks']],
    ['p8', 'Painting & Finishing', 10, ['p7'], ['Putty', 'Primer', 'Paint', 'CP fittings']],
    ['p9', 'Snagging & Handover', 5, ['p8'], ['QA checks', 'Punch list', 'Handover pack']],
  ] as const;
  const scale = baseDuration / 94;
  let cursor = 1;
  return phaseSeed.map(([id, name, duration, dependencies, deliverables]) => {
    const scaled = Math.max(3, Math.round(duration * scale));
    const startDay = cursor;
    const endDay = startDay + scaled - 1;
    cursor = endDay + 1;
    return { id, name, durationDays: scaled, startDay, endDay, dependencies: [...dependencies], deliverables: [...deliverables] };
  });
}

function createTasks(phases: PhaseItem[]): TaskItem[] {
  const seeds = [
    ['p1', 'Freeze scope, quality tier, and payment terms', 'Owner', [], 'Rate sheet and contract signed off'],
    ['p1', 'Approve city-rate assumptions and water source', 'Owner', [], 'Water source confirmed with storage plan'],
    ['p2', 'Excavation and footing check', 'Supervisor', ['task-1'], 'Depth and marking verified'],
    ['p2', 'Record steel before concrete', 'Supervisor', ['task-3'], 'Photo record and bar spacing approved'],
    ['p3', 'Column and slab pour QA', 'Engineer', ['task-4'], 'Cube test and cover blocks checked'],
    ['p4', 'Wall line, plumb, and thickness inspection', 'Supervisor', ['task-5'], 'Wall sample approved'],
    ['p5', 'Electrical conduit photo record', 'Electrician', ['task-6'], 'Photos stored before plastering'],
    ['p5', 'Plumbing pressure test and point marking', 'Plumber', ['task-6'], 'Pressure hold completed'],
    ['p6', 'Plaster sample bay approval', 'Owner', ['task-7', 'task-8'], 'Sample bay signed off'],
    ['p7', 'Bathroom slope and pond test signoff', 'Owner', ['task-9'], 'Pond test passed for 24 hours'],
    ['p8', 'Paint shade and fitting signoff', 'Owner', ['task-10'], 'Final visible finish checklist approved'],
    ['p9', 'Snag closure, manuals, and handover pack', 'Supervisor', ['task-11'], 'Snag list closed'],
  ] as const;

  return seeds.map(([phaseId, name, owner, dependencyTaskIds, qaCheckpoint], index) => {
    const phase = phases.find((item) => item.id === phaseId)!;
    return {
      id: `task-${index + 1}`,
      phaseId,
      phaseName: phase.name,
      name,
      owner,
      durationDays: Math.max(1, Math.round(phase.durationDays / 4)),
      status: index < 2 ? 'in_progress' : 'todo',
      materials: phaseId === 'p3' ? ['Cement', 'Steel'] : phaseId === 'p5' ? ['CPVC Pipes & Fittings', 'Electrical Package'] : [],
      dependencyTaskIds: [...dependencyTaskIds],
      qaCheckpoint,
    };
  });
}

function createProcurementPlan(phases: PhaseItem[], materials: MaterialItem[]): ProcurementItem[] {
  const dayFor = (phaseId: string) => phases.find((p) => p.id === phaseId)?.startDay ?? 1;
  return [
    { id: 'pr1', stage: 'Planning', itemGroup: 'Contract terms, drawings, site setup', triggerDay: 1, quantityHint: 'Lock full project baseline', whyNow: 'Without baseline, later rate comparisons become meaningless.', holdPoint: 'No mobilization advance without signed scope.' },
    { id: 'pr2', stage: 'Foundation', itemGroup: 'Cement, steel, sand, aggregate', triggerDay: dayFor('p2') - 2, quantityHint: 'First 20 to 25% of civil material', whyNow: 'Foundation delays start the whole cascade of labour idle time.', holdPoint: 'Check actual inward quantity and test certificates before payment.' },
    { id: 'pr3', stage: 'RCC Structure', itemGroup: 'Shuttering accessories, steel top-up, curing setup', triggerDay: dayFor('p3') - 2, quantityHint: 'RCC critical materials', whyNow: 'Slab day is the costliest day to get wrong.', holdPoint: 'Approve pour checklist one day before casting.' },
    { id: 'pr4', stage: 'Masonry + MEP', itemGroup: 'Blocks/bricks, CPVC, UPVC, conduits, wires', triggerDay: dayFor('p4') + 2, quantityHint: 'Wall and rough-in lots', whyNow: 'Rough-ins should start only after point layout is frozen.', holdPoint: 'Pressure test and conduit photos before plaster.' },
    { id: 'pr5', stage: 'Finishes', itemGroup: 'Tiles, sanitary, switches, lights, paint', triggerDay: dayFor('p7') - 3, quantityHint: 'Visible finish schedule', whyNow: 'Late finish selection causes rework and rushed buying.', holdPoint: 'Approve actual models and samples, not only brand name.' },
  ].map((row) => ({
    ...row,
    quantityHint: row.itemGroup === 'Visible finish schedule'
      ? row.quantityHint
      : `${row.quantityHint}. Example budget anchor: ${inr(materials.slice(0, 3).reduce((sum, item) => sum + item.amount, 0))}`,
  }));
}

function buildBreakdown(materials: MaterialItem[], labour: LabourItem[], totalCost: number) {
  const labourCost = labour.reduce((sum, item) => sum + item.totalCost, 0);
  const materialCost = materials.reduce((sum, item) => sum + item.amount, 0);
  const waterAndUtilities = totalCost * 0.025;
  const siteOverheads = totalCost * 0.035;
  const contingency = totalCost * 0.05;
  const designAndAdmin = totalCost * 0.03;
  const remainder = Math.max(0, totalCost - (labourCost + materialCost + waterAndUtilities + siteOverheads + contingency + designAndAdmin));
  return [
    { category: 'Materials', amount: materialCost },
    { category: 'Labour', amount: labourCost },
    { category: 'Water & Utilities', amount: waterAndUtilities },
    { category: 'Site Overheads', amount: siteOverheads },
    { category: 'Design / Admin', amount: designAndAdmin },
    { category: 'Contingency', amount: contingency },
    { category: 'Other Civil / Finishing Reserve', amount: remainder },
  ].map((item) => ({ ...item, percentage: Number(((item.amount / totalCost) * 100).toFixed(1)) }));
}

function createInsights(input: ProjectInput): InsightBlock[] {
  return [
    {
      title: 'How to identify best quality',
      points: [
        'Approve one sample for each hidden work and one sample for each visible finish before bulk execution.',
        'Ask for invoices, batch numbers, mill certificates, and actual model list before payment release.',
        'Compare billed quantity with site measurements every stage instead of checking only final amount.',
      ],
    },
    {
      title: 'How not to get fooled by workers',
      points: [
        'Pay against measurable outputs only: completed tested milestone, not vague progress language.',
        'Photograph hidden works like conduits, steel, waterproofing, and sleeves before closing them.',
        'Keep a daily inward and outward register for cement, steel, sand, blocks, and plumbing fittings.',
      ],
    },
    {
      title: 'Vastu suggestions',
      points: input.vastuPriority
        ? [
            'Prefer entry in north, east, or northeast if site allows.',
            'Keep kitchen orientation checked before plumbing and electrical wall chasing begins.',
            'Avoid moving major room function after slab stage, because it creates costly MEP rework.',
          ]
        : ['Vastu priority is off, so layout is optimized for cost and buildability first.'],
    },
  ];
}

function createQualityChecks(): QualityCheckItem[] {
  return [
    { title: 'Foundation depth and PCC', trade: 'Civil', whyItMatters: 'Incorrect depth creates settlement risk.', checkWhen: 'Before footing steel', howToVerify: 'Measure depth at multiple grid points and record photos with tape.' },
    { title: 'Steel spacing and cover blocks', trade: 'RCC', whyItMatters: 'Poor cover accelerates corrosion.', checkWhen: 'Before every concrete pour', howToVerify: 'Use cover blocks, compare to bar bending schedule, photograph before pour.' },
    { title: 'Conduit mapping', trade: 'Electrical', whyItMatters: 'Missing photo records cause later drill damage and costly rewiring.', checkWhen: 'Before plastering', howToVerify: 'Take wall-by-wall photos with room labels.' },
    { title: 'Plumbing pressure test', trade: 'Plumbing', whyItMatters: 'Hidden leaks become expensive after tiles.', checkWhen: 'Before plastering and before sanitary fixing', howToVerify: 'Hold pressure and check visible gauge drop plus joint inspection.' },
    { title: 'Waterproofing pond test', trade: 'Finishes', whyItMatters: 'Bathrooms and terraces fail later if rushed.', checkWhen: 'Before tile laying / screed closeout', howToVerify: '24-hour pond test with marked water level.' },
  ];
}

function baseAiAnalysis(city: CityRate, input: ProjectInput): AIAnalysis {
  return {
    status: 'idle',
    summary: `Rule-based analysis ready for ${city.city}. Run OpenAI analysis for owner-side risk review and location-specific questions.`,
    risks: [`Water source set to ${titleize(getWaterSource(city, input))}; verify actual site availability before RCC peak.`],
    opportunities: ['Freeze plumbing and electrical point layouts before wall chasing to reduce rework.'],
    procurementNotes: ['Approve actual brand/model sheets for sanitary, switches, wires, and tiles before buying lots.'],
    paymentReleaseChecks: ['Do not release MEP milestone payment before conduit photos and plumbing pressure test.'],
    locationInsights: [`Location factor ${city.locationFactor.toFixed(2)} and labour factor ${city.labourFactor.toFixed(2)} are currently applied.`],
    plumbingInsights: ['Confirm concealed pipe pressure class and spare part availability in your city.'],
    electricalInsights: ['Keep separate circuit schedule for AC, geyser, kitchen, and general loads.'],
    ownerQuestions: ['Do you want premium visible finishes but standard hidden works, or one consistent tier?'],
  };
}

function createMaterials(input: ProjectInput, totalCost: number, city: CityRate, materialRates: MaterialRate[]) {
  const boost = city.locationFactor * city.transportFactor;
  const areaFactor = input.builtUpSft / 1000;
  const qualityFactor = qualityFactorMap[input.qualityLevel];
  const cement = rateOf(materialRates, 'cement', defaultMaterialRates);
  const steel = rateOf(materialRates, 'steel', defaultMaterialRates);
  const sand = rateOf(materialRates, 'sand', defaultMaterialRates);
  const aggregate = rateOf(materialRates, 'aggregate', defaultMaterialRates);
  const brick = rateOf(materialRates, 'brick', defaultMaterialRates);
  const cpvc = rateOf(materialRates, 'cpvc', defaultMaterialRates);
  const upvc = rateOf(materialRates, 'upvc', defaultMaterialRates);
  const sanitary = rateOf(materialRates, 'sanitary', defaultMaterialRates);
  const electrical = rateOf(materialRates, 'electrical', defaultMaterialRates);
  const flooring = rateOf(materialRates, 'flooring', defaultMaterialRates);
  const plumbingFactor = plumbingTierFactor[input.plumbingTier];
  const electricalFactor = electricalTierFactor[input.electricalTier];
  const waterPlan = createWaterPlan(input, city);
  const totalWaterL = waterPlan.reduce((sum, row) => sum + row.totalLitres, 0);
  const base = [
    ['Cement', 'bags', 420 * areaFactor * qualityFactor, cement.baseRate * boost, 'Use same brand batch where possible.', 'Structure'],
    ['Steel', 'kg', 3800 * areaFactor * qualityFactor, steel.baseRate * boost, 'Prefer Fe500/Fe550 with test certificates.', 'Structure'],
    ['Sand', 'cft', 1900 * areaFactor, sand.baseRate * boost, 'Verify silt content before batching.', 'Civil'],
    ['Aggregate', 'cft', 1300 * areaFactor, aggregate.baseRate * boost, 'Insist on graded aggregate.', 'Civil'],
    ['Bricks / Blocks', 'nos', input.wallType === 'aac_block' ? 9000 * areaFactor : 14000 * areaFactor, (input.wallType === 'aac_block' ? 55 : brick.baseRate) * boost, 'Check lot quality and size variation.', 'Masonry'],
    ['Electrical Package', 'lot', 1, electrical.baseRate * electricalFactor * boost, 'Freeze point schedule room by room before buying.', 'MEP'],
    ['CPVC Pipes & Fittings', 'lot', 1, cpvc.baseRate * plumbingFactor * boost, 'Do not mix local pieces into concealed work.', 'MEP'],
    ['UPVC Drainage', 'lot', 1, upvc.baseRate * plumbingFactor * boost, 'Check slope, clamp spacing, and access points.', 'MEP'],
    ['Sanitary & CP Fittings', 'lot', 1, sanitary.baseRate * plumbingFactor * boost, 'Approve actual model list before site purchase.', 'Finishing'],
    ['Tiles & Flooring', 'sft', input.builtUpSft * 0.85, flooring.baseRate * qualityFactor * boost, 'Approve sample board before bulk procurement.', 'Finishing'],
    ['Doors & Windows', 'lot', 1, totalCost * 0.07, 'Ask for section thickness and hardware brand list.', 'Finishing'],
    ['Paint & Putty', 'sft', input.builtUpSft * 2.7, input.qualityLevel === 'premium' ? 38 : 26, 'Check surface prep, not just paint brand.', 'Finishing'],
    ['Water & Curing', 'litres', totalWaterL, (city.waterCostPer1000L || 180) / 1000, 'Plan stage-wise storage instead of last-minute tanker calls.', 'Utilities'],
  ] as const;
  return base.map(([name, unit, quantity, rate, note, stage]) => ({ name, unit, quantity: Number(quantity.toFixed(2)), rate: Number(rate.toFixed(2)), amount: Number((quantity * rate).toFixed(2)), note, stage }));
}

export function generateEstimate(input: ProjectInput, cityRates: CityRate[] = defaultCities, materialRates: MaterialRate[] = defaultMaterialRates, labourRates: LabourRate[] = defaultLabourRates): EstimateResult {
  const usingFallbackMasters = !(cityRates.length && materialRates.length && labourRates.length);
  const city = findCity(cityRates.length ? cityRates : defaultCities, input.location);
  const baseRate = qualityRateMap[input.qualityLevel];
  const rate = baseRate * city.locationFactor * foundationFactor(input.foundationType) * wallFactor(input.wallType) * slabFactor(input.slabType);
  const totalCost = Math.round(input.builtUpSft * rate + extraCost(input));
  const costPerSft = Math.round(totalCost / input.builtUpSft);
  const materials = createMaterials(input, totalCost, city, materialRates);
  const labour = createLabour(input, labourRates, city);
  const phases = createPhases(input);
  const tasks = createTasks(phases);
  const waterPlan = createWaterPlan(input, city);
  const plumbingPlan = createPlumbingPlan(input);
  const electricalPlan = createElectricalPlan(input);
  const procurementPlan = createProcurementPlan(phases, materials);
  const breakdown = buildBreakdown(materials, labour, totalCost);
  const assumptions = [
    usingFallbackMasters ? 'Admin masters are not configured yet, so the estimate is using temporary in-memory planning defaults. These fallback values are not saved to Firestore.' : `Location-based rates are derived from ${city.city}, ${city.state ?? 'India'} masters.`,
    `Hidden-work quality tier is ${titleize(input.qualityLevel)} with ${titleize(input.plumbingTier)} plumbing and ${titleize(input.electricalTier)} electrical.`,
    `Water plan assumes ${titleize(getWaterSource(city, input))} as working source during execution.`,
    'This is owner-side planning intelligence, not a structural engineer signoff or statutory approval set.',
  ];
  const totalWater = waterPlan.reduce((sum, row) => sum + row.totalLitres, 0);
  const summary = [
    { label: 'Project', value: input.projectName },
    { label: 'Location', value: city.city },
    { label: 'Built-up area', value: `${input.builtUpSft} sft` },
    { label: 'Cost / sft', value: inr(costPerSft) },
    { label: 'Total estimate', value: inr(totalCost) },
    { label: 'Water plan', value: `${Math.round(totalWater / 1000)} KL` },
    { label: 'Plumbing items', value: String(plumbingPlan.length) },
    { label: 'Electrical points', value: String(electricalPlan.reduce((sum, row) => sum + row.quantity, 0)) },
  ];

  return {
    summary,
    totalCost,
    costPerSft,
    breakdown,
    materials,
    labour,
    phases,
    tasks,
    insights: createInsights(input),
    assumptions,
    waterPlan,
    plumbingPlan,
    electricalPlan,
    procurementPlan,
    qualityChecks: createQualityChecks(),
    aiAnalysis: baseAiAnalysis(city, input),
  };
}
