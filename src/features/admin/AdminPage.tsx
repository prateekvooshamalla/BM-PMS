import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { refreshMarketRatesWithAI } from '../../lib/ai';
import {
  consolidateVerifiedRates,
  listVerifiedPriceEntries,
  replaceMasterCollection,
  replaceVerifiedPriceEntries,
  saveMarketSnapshot,
} from '../../lib/firestoreService';
import { CityRate, LabourRate, MaterialRate, PriceSourceMode, VerifiedPriceEntry } from '../../types';
import { PageSection } from '../../components/common/PageSection';

function NumberCell({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return <TextField size="small" type="number" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} />;
}

const createCity = (): CityRate => ({
  id: `city-${crypto.randomUUID()}`,
  city: '',
  state: '',
  locationFactor: 1,
  labourFactor: 1,
  transportFactor: 1,
  waterCostPer1000L: 0,
  tankerAvailability: 'medium',
  typicalWaterSource: 'mixed',
});

const createMaterial = (): MaterialRate => ({ id: `mat-${crypto.randomUUID()}`, name: '', unit: 'nos', baseRate: 0 });
const createLabour = (): LabourRate => ({ id: `lab-${crypto.randomUUID()}`, labourType: '', ratePerDay: 0 });
const createVerified = (cityId: string): VerifiedPriceEntry => ({
  id: `vp-${crypto.randomUUID()}`,
  cityId,
  materialId: '',
  materialName: '',
  unit: 'nos',
  supplierName: '',
  rate: 0,
  quoteDate: new Date().toISOString().slice(0, 10),
  sourceType: 'supplier_quote',
  validityDays: 7,
  note: '',
});

export function AdminPage({
  cityRates,
  materialRates,
  labourRates,
  onMastersChanged,
}: {
  cityRates: CityRate[];
  materialRates: MaterialRate[];
  labourRates: LabourRate[];
  onMastersChanged: () => Promise<void>;
}) {
  const [cities, setCities] = useState<CityRate[]>(cityRates);
  const [materials, setMaterials] = useState<MaterialRate[]>(materialRates);
  const [labour, setLabour] = useState<LabourRate[]>(labourRates);
  const [verifiedPrices, setVerifiedPrices] = useState<VerifiedPriceEntry[]>([]);
  const [status, setStatus] = useState('');
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState(cityRates[0]?.id || '');
  const [sourceMode, setSourceMode] = useState<PriceSourceMode>('hybrid');
  const [autoApplyMarket, setAutoApplyMarket] = useState(true);

  useEffect(() => {
    setCities(cityRates);
    setMaterials(materialRates);
    setLabour(labourRates);
    if (!selectedCityId && cityRates[0]?.id) setSelectedCityId(cityRates[0].id);
  }, [cityRates, materialRates, labourRates, selectedCityId]);

  useEffect(() => {
    if (!selectedCityId) return;
    listVerifiedPriceEntries(selectedCityId).then(setVerifiedPrices).catch(() => setVerifiedPrices([]));
  }, [selectedCityId]);

  const selectedCityMeta = useMemo(() => cities.find((row) => row.id === selectedCityId) ?? null, [cities, selectedCityId]);

  const saveAll = async () => {
    try {
      setStatus('Saving admin masters and verified supplier prices...');
      await Promise.all([
        replaceMasterCollection('cities', cities.filter((row) => row.city.trim())),
        replaceMasterCollection('materials', materials.filter((row) => row.name.trim())),
        replaceMasterCollection('labour', labour.filter((row) => row.labourType.trim())),
        selectedCityId ? replaceVerifiedPriceEntries(selectedCityId, verifiedPrices.filter((row) => row.materialId && row.supplierName)) : Promise.resolve(),
      ]);
      await onMastersChanged();
      setStatus('Admin masters saved.');
    } catch {
      setStatus('Could not save masters. Check Firestore rules and admin role setup.');
    }
  };

  const refreshMarket = async () => {
    if (!selectedCityMeta || materials.length < 1) {
      setStatus('Add at least one city and one material before running market analysis.');
      return;
    }
    try {
      setLoadingMarket(true);
      setStatus('Running OpenAI market analysis with web search...');
      const response = await refreshMarketRatesWithAI({
        city: selectedCityMeta.city,
        state: selectedCityMeta.state,
        materials,
        sourceMode,
      });
      await saveMarketSnapshot(selectedCityMeta.id, response);
      if (autoApplyMarket) {
        const merged = materials.map((item) => {
          const hit = response.items.find((x) => x.materialId === item.id);
          return hit ? { ...item, baseRate: Math.round(hit.suggestedRate) } : item;
        });
        setMaterials(merged);
        setStatus(`Market rates refreshed for ${selectedCityMeta.city} and applied to material masters.`);
      } else {
        setStatus(`Market rates refreshed for ${selectedCityMeta.city}. Review and save manually.`);
      }
    } catch {
      setStatus('Market refresh failed. Deploy refreshMarketRates callable function, set OPENAI_API_KEY, and verify admin auth.');
    } finally {
      setLoadingMarket(false);
    }
  };

  const applyVerifiedMedian = () => {
    setMaterials(consolidateVerifiedRates(materials, verifiedPrices));
    setStatus('Applied verified supplier median rates to the material master. Review and save to persist.');
  };

  return (
    <Stack spacing={3}>
      <PageSection title="Admin masters" subtitle="Accordion-based settings for city rates, materials, labour, verified supplier prices, and AI market refresh.">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel>Market city</InputLabel>
            <Select label="Market city" value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}>
              {cities.map((city) => <MenuItem key={city.id} value={city.id}>{city.city || city.id}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }} size="small">
            <InputLabel>Price mode</InputLabel>
            <Select label="Price mode" value={sourceMode} onChange={(e) => setSourceMode(e.target.value as PriceSourceMode)}>
              <MenuItem value="manual">Manual only</MenuItem>
              <MenuItem value="market">AI market study</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={autoApplyMarket} onChange={(e) => setAutoApplyMarket(e.target.checked)} />} label="Auto-apply market study" />
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={refreshMarket} disabled={loadingMarket || sourceMode === 'manual'}>{loadingMarket ? 'Refreshing...' : 'Analyze market prices'}</Button>
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={saveAll}>Save all masters</Button>
        </Stack>
        {status ? <Alert sx={{ mt: 2 }} severity="info">{status}</Alert> : null}
      </PageSection>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">City settings</Typography><Chip label="Location factors" size="small" /></Stack></AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography color="text.secondary">Add only real city masters you intend to support.</Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setCities((rows) => [...rows, createCity()])}>Add city</Button>
            </Stack>
            <Table size="small"><TableHead><TableRow><TableCell>City</TableCell><TableCell>State</TableCell><TableCell>Location factor</TableCell><TableCell>Labour factor</TableCell><TableCell>Transport factor</TableCell><TableCell>Water / 1000L</TableCell></TableRow></TableHead><TableBody>{cities.map((row, idx) => <TableRow key={row.id}><TableCell><TextField size="small" value={row.city} onChange={(e) => setCities(cities.map((item, i) => i === idx ? { ...item, city: e.target.value } : item))} /></TableCell><TableCell><TextField size="small" value={row.state || ''} onChange={(e) => setCities(cities.map((item, i) => i === idx ? { ...item, state: e.target.value } : item))} /></TableCell><TableCell><NumberCell value={row.locationFactor} onChange={(next) => setCities(cities.map((item, i) => i === idx ? { ...item, locationFactor: next } : item))} /></TableCell><TableCell><NumberCell value={row.labourFactor} onChange={(next) => setCities(cities.map((item, i) => i === idx ? { ...item, labourFactor: next } : item))} /></TableCell><TableCell><NumberCell value={row.transportFactor} onChange={(next) => setCities(cities.map((item, i) => i === idx ? { ...item, transportFactor: next } : item))} /></TableCell><TableCell><NumberCell value={row.waterCostPer1000L || 0} onChange={(next) => setCities(cities.map((item, i) => i === idx ? { ...item, waterCostPer1000L: next } : item))} /></TableCell></TableRow>)}</TableBody></Table>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">Material settings</Typography><Chip label="Realtime + manual" size="small" /></Stack></AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography color="text.secondary">Rates can be refreshed from OpenAI market analysis and still edited manually before saving.</Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setMaterials((rows) => [...rows, createMaterial()])}>Add material</Button>
            </Stack>
            <Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Unit</TableCell><TableCell>Base rate</TableCell></TableRow></TableHead><TableBody>{materials.map((row, idx) => <TableRow key={row.id}><TableCell><TextField size="small" value={row.name} onChange={(e) => setMaterials(materials.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))} /></TableCell><TableCell><TextField size="small" value={row.unit} onChange={(e) => setMaterials(materials.map((item, i) => i === idx ? { ...item, unit: e.target.value } : item))} /></TableCell><TableCell><NumberCell value={row.baseRate} onChange={(next) => setMaterials(materials.map((item, i) => i === idx ? { ...item, baseRate: next } : item))} /></TableCell></TableRow>)}</TableBody></Table>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">Labour settings</Typography><Chip label="Manual rates" size="small" /></Stack></AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography color="text.secondary">Keep labour rates tied to local trade reality and update them regularly.</Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setLabour((rows) => [...rows, createLabour()])}>Add labour trade</Button>
            </Stack>
            <Table size="small"><TableHead><TableRow><TableCell>Trade</TableCell><TableCell>Rate / day</TableCell></TableRow></TableHead><TableBody>{labour.map((row, idx) => <TableRow key={row.id}><TableCell><TextField size="small" value={row.labourType} onChange={(e) => setLabour(labour.map((item, i) => i === idx ? { ...item, labourType: e.target.value } : item))} /></TableCell><TableCell><NumberCell value={row.ratePerDay} onChange={(next) => setLabour(labour.map((item, i) => i === idx ? { ...item, ratePerDay: next } : item))} /></TableCell></TableRow>)}</TableBody></Table>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">Verified supplier prices</Typography><Chip label="Production procurement" size="small" color="success" /></Stack></AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography color="text.secondary">Use this section for actual supplier quotes, dealer calls, site invoices, or purchase history. This is the production-safe complement to AI market study.</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <Button size="small" startIcon={<AddRoundedIcon />} disabled={!selectedCityId} onClick={() => setVerifiedPrices((rows) => [...rows, createVerified(selectedCityId)])}>Add verified price</Button>
              <Button size="small" variant="outlined" disabled={verifiedPrices.length < 1} onClick={applyVerifiedMedian}>Apply verified median to material masters</Button>
            </Stack>
            <Divider />
            <Table size="small"><TableHead><TableRow><TableCell>Material ID</TableCell><TableCell>Material name</TableCell><TableCell>Unit</TableCell><TableCell>Supplier</TableCell><TableCell>Rate</TableCell><TableCell>Quote date</TableCell><TableCell>Source</TableCell></TableRow></TableHead><TableBody>{verifiedPrices.map((row, idx) => <TableRow key={row.id}><TableCell><TextField size="small" value={row.materialId} onChange={(e) => setVerifiedPrices(verifiedPrices.map((item, i) => i === idx ? { ...item, materialId: e.target.value } : item))} /></TableCell><TableCell><TextField size="small" value={row.materialName} onChange={(e) => setVerifiedPrices(verifiedPrices.map((item, i) => i === idx ? { ...item, materialName: e.target.value } : item))} /></TableCell><TableCell><TextField size="small" value={row.unit} onChange={(e) => setVerifiedPrices(verifiedPrices.map((item, i) => i === idx ? { ...item, unit: e.target.value } : item))} /></TableCell><TableCell><TextField size="small" value={row.supplierName} onChange={(e) => setVerifiedPrices(verifiedPrices.map((item, i) => i === idx ? { ...item, supplierName: e.target.value } : item))} /></TableCell><TableCell><NumberCell value={row.rate} onChange={(next) => setVerifiedPrices(verifiedPrices.map((item, i) => i === idx ? { ...item, rate: next } : item))} /></TableCell><TableCell><TextField size="small" type="date" value={row.quoteDate} onChange={(e) => setVerifiedPrices(verifiedPrices.map((item, i) => i === idx ? { ...item, quoteDate: e.target.value } : item))} /></TableCell><TableCell><FormControl size="small"><Select value={row.sourceType} onChange={(e) => setVerifiedPrices(verifiedPrices.map((item, i) => i === idx ? { ...item, sourceType: e.target.value as VerifiedPriceEntry['sourceType'] } : item))}><MenuItem value="supplier_quote">Supplier quote</MenuItem><MenuItem value="dealer_call">Dealer call</MenuItem><MenuItem value="invoice">Invoice</MenuItem><MenuItem value="site_purchase">Site purchase</MenuItem></Select></FormControl></TableCell></TableRow>)}</TableBody></Table>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">Deployment and validation notes</Typography><Chip label="Prod checklist" size="small" /></Stack></AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography fontWeight={700}>What this revision adds</Typography>
              <Typography variant="body2" color="text.secondary">• admin-only masters and pricing flows</Typography>
              <Typography variant="body2" color="text.secondary">• AI market study with web search as advisory input</Typography>
              <Typography variant="body2" color="text.secondary">• verified supplier price workflow for procurement-safe rates</Typography>
              <Typography variant="body2" color="text.secondary">• no automatic dummy masters stored in Firestore</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography fontWeight={700}>Before launch</Typography>
              <Typography variant="body2" color="text.secondary">• verify App Check enforcement gradually</Typography>
              <Typography variant="body2" color="text.secondary">• assign admin role through the users collection or custom claims</Typography>
              <Typography variant="body2" color="text.secondary">• run emulator rules tests before each deploy</Typography>
              <Typography variant="body2" color="text.secondary">• review supplier quotes against GST, freight, and validity</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
