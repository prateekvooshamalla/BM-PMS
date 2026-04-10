import { useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { compareVendorQuotesWithAI } from '../../lib/ai';
import { saveVendorQuote } from '../../lib/firestoreService';
import { inr } from '../../lib/utils';
import { EstimateResult, ProjectInput, QuoteComparisonResult, VendorQuote, VendorQuoteItem } from '../../types';
import { PageSection } from '../../components/common/PageSection';

const emptyItem = (): VendorQuoteItem => ({
  category: 'civil',
  description: '',
  unit: 'lot',
  quantity: 1,
  rate: 0,
  amount: 0,
});

const createQuote = (vendorName: string): VendorQuote => ({
  vendorName,
  location: 'Hyderabad',
  validityDays: 15,
  gstIncluded: true,
  paymentTerms: '30% advance, stage-based releases',
  timelineDays: 180,
  items: [emptyItem(), emptyItem()],
});

export function VendorQuotesPage({ activeProjectId, input, result }: { activeProjectId?: string; input: ProjectInput; result: EstimateResult }) {
  const [quotes, setQuotes] = useState<VendorQuote[]>([createQuote('Vendor A'), createQuote('Vendor B')]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<QuoteComparisonResult | null>(null);

  const totals = useMemo(() => quotes.map((quote) => ({
    vendorName: quote.vendorName,
    total: quote.items.reduce((sum, item) => sum + item.amount, 0),
  })), [quotes]);

  const updateQuote = (quoteIndex: number, patch: Partial<VendorQuote>) => {
    setQuotes((current) => current.map((quote, index) => index === quoteIndex ? { ...quote, ...patch } : quote));
  };

  const updateItem = (quoteIndex: number, itemIndex: number, patch: Partial<VendorQuoteItem>) => {
    setQuotes((current) => current.map((quote, index) => {
      if (index !== quoteIndex) return quote;
      const items = quote.items.map((item, idx) => {
        if (idx !== itemIndex) return item;
        const next = { ...item, ...patch };
        return { ...next, amount: Number((next.quantity * next.rate).toFixed(2)) };
      });
      return { ...quote, items };
    }));
  };

  const addLineItem = (quoteIndex: number) => {
    setQuotes((current) => current.map((quote, index) => index === quoteIndex ? { ...quote, items: [...quote.items, emptyItem()] } : quote));
  };

  const runComparison = async () => {
    try {
      setLoading(true);
      setStatus('Running AI comparison across the quote sets…');
      const next = await compareVendorQuotesWithAI({ project: input, estimate: result, quotes });
      setComparison(next);
      setStatus('AI quote comparison ready.');
    } catch {
      setStatus('Quote comparison failed. Deploy compareVendorQuotes in Firebase Functions.');
    } finally {
      setLoading(false);
    }
  };

  const saveAll = async () => {
    if (!activeProjectId) {
      setStatus('Save the project first from the Estimate Wizard, then quote history can be stored under that project.');
      return;
    }
    try {
      setStatus('Saving quotes…');
      for (const quote of quotes) {
        await saveVendorQuote(activeProjectId, quote);
      }
      setStatus('Quotes saved under the current project.');
    } catch {
      setStatus('Could not save quotes. Check Firestore rules.');
    }
  };

  return (
    <Stack spacing={3}>
      <PageSection title="Vendor quotation comparison" subtitle="Compare contractor and vendor proposals before finalizing procurement or work orders.">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <Button variant="contained" startIcon={<AutoAwesomeOutlinedIcon />} onClick={runComparison} disabled={loading}>{loading ? 'Comparing…' : 'Compare with AI'}</Button>
          <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={saveAll}>Save quotes</Button>
        </Stack>
        {status ? <Alert sx={{ mt: 2 }} severity="info">{status}</Alert> : null}
      </PageSection>

      <Grid container spacing={2.5}>
        {quotes.map((quote, quoteIndex) => (
          <Grid size={{ xs: 12, xl: 6 }} key={quote.vendorName + quoteIndex}>
            <PageSection
              title={quote.vendorName || `Vendor ${quoteIndex + 1}`}
              subtitle="Enter vendor scope, pricing, and terms."
              actions={<Typography variant="body2" color="text.secondary">Total: {inr(totals[quoteIndex]?.total || 0)}</Typography>}
            >
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Vendor name" fullWidth value={quote.vendorName} onChange={(e) => updateQuote(quoteIndex, { vendorName: e.target.value })} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Location" fullWidth value={quote.location} onChange={(e) => updateQuote(quoteIndex, { location: e.target.value })} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField label="Validity days" fullWidth type="number" value={quote.validityDays} onChange={(e) => updateQuote(quoteIndex, { validityDays: Number(e.target.value) })} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField label="Timeline days" fullWidth type="number" value={quote.timelineDays} onChange={(e) => updateQuote(quoteIndex, { timelineDays: Number(e.target.value) })} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField label="Payment terms" fullWidth value={quote.paymentTerms} onChange={(e) => updateQuote(quoteIndex, { paymentTerms: e.target.value })} /></Grid>
              </Grid>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quote.items.map((item, itemIndex) => (
                    <TableRow key={`${quoteIndex}-${itemIndex}`}>
                      <TableCell sx={{ minWidth: 140 }}>
                        <TextField select size="small" value={item.category} onChange={(e) => updateItem(quoteIndex, itemIndex, { category: e.target.value as VendorQuoteItem['category'] })}>
                          <MenuItem value="civil">Civil</MenuItem>
                          <MenuItem value="steel">Steel</MenuItem>
                          <MenuItem value="plumbing">Plumbing</MenuItem>
                          <MenuItem value="electrical">Electrical</MenuItem>
                          <MenuItem value="finishing">Finishing</MenuItem>
                          <MenuItem value="labour">Labour</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}><TextField size="small" value={item.description} onChange={(e) => updateItem(quoteIndex, itemIndex, { description: e.target.value })} placeholder="Example: CPVC internal lines" /></TableCell>
                      <TableCell><TextField size="small" type="number" value={item.quantity} onChange={(e) => updateItem(quoteIndex, itemIndex, { quantity: Number(e.target.value) })} /></TableCell>
                      <TableCell><TextField size="small" type="number" value={item.rate} onChange={(e) => updateItem(quoteIndex, itemIndex, { rate: Number(e.target.value) })} /></TableCell>
                      <TableCell>{inr(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ mt: 2 }}>
                <Button size="small" onClick={() => addLineItem(quoteIndex)}>Add line item</Button>
              </Box>
            </PageSection>
          </Grid>
        ))}
      </Grid>

      <PageSection title="Comparison output" subtitle="AI highlights best value, red flags, and negotiation angles.">
        {comparison ? (
          <Stack spacing={2}>
            <Typography>{comparison.summary}</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><Alert severity="success">Best value: {comparison.bestValueVendor}</Alert></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Alert severity="info">Cheapest: {comparison.cheapestVendor}</Alert></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Alert severity="warning">Fastest: {comparison.fastestVendor}</Alert></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography fontWeight={700}>Negotiation points</Typography>
                <ul>{comparison.negotiationPoints.map((point) => <li key={point}><Typography variant="body2">{point}</Typography></li>)}</ul>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography fontWeight={700}>Red flags</Typography>
                <ul>{comparison.redFlags.map((point) => <li key={point}><Typography variant="body2">{point}</Typography></li>)}</ul>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography fontWeight={700}>Scope gaps</Typography>
                <ul>{comparison.scopeGaps.map((point) => <li key={point}><Typography variant="body2">{point}</Typography></li>)}</ul>
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Alert severity="info">Enter at least two quote sets, then run AI comparison.</Alert>
        )}
      </PageSection>
    </Stack>
  );
}
