import { useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Alert,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { reviewSiteObservationWithAI } from '../../lib/ai';
import { saveSiteObservation } from '../../lib/firestoreService';
import { ProjectInput, SiteObservationInput, SiteObservationResult } from '../../types';
import { PageSection } from '../../components/common/PageSection';

const defaultChecklist = [
  'Verify dimensions with tape and drawing before approving the stage.',
  'Photograph concealed lines before plastering or floor closure.',
  'Check material brand, batch, and thickness against the bill.',
  'Release payment only after stage QA is signed off.',
];

export function SiteQaPage({ activeProjectId, input }: { activeProjectId?: string; input: ProjectInput }) {
  const [form, setForm] = useState<SiteObservationInput>({
    projectName: input.projectName,
    location: input.location,
    phase: 'Plumbing rough-in',
    observationNotes: '',
    imageUrl: '',
    checklist: defaultChecklist,
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SiteObservationResult | null>(null);

  const runReview = async () => {
    try {
      setLoading(true);
      setStatus('Running AI QA review…');
      const next = await reviewSiteObservationWithAI(form);
      setResult(next);
      setStatus('Site QA review ready.');
    } catch {
      setStatus('Site QA review failed. Deploy reviewSiteObservation in Firebase Functions.');
    } finally {
      setLoading(false);
    }
  };

  const saveReview = async () => {
    if (!activeProjectId) {
      setStatus('Save the project first from the Estimate Wizard, then site observations can be stored under that project.');
      return;
    }
    try {
      await saveSiteObservation(activeProjectId, form, result || undefined);
      setStatus('Site observation saved.');
    } catch {
      setStatus('Could not save the site observation. Check Firestore rules.');
    }
  };

  return (
    <Stack spacing={3}>
      <PageSection title="Site QA review" subtitle="Owner-side observation notes, optional image URL, and AI-generated hold points.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Project" fullWidth value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Location" fullWidth value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Current phase" fullWidth value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} /></Grid>
          <Grid size={{ xs: 12 }}><TextField label="Observation notes" fullWidth multiline minRows={5} value={form.observationNotes} onChange={(e) => setForm({ ...form, observationNotes: e.target.value })} helperText="Example: plumber used lower-grade bend, no pressure test record, slope looks doubtful near utility drain." /></Grid>
          <Grid size={{ xs: 12 }}><TextField label="Image URL (optional)" fullWidth value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} helperText="V2.4 passes this URL into the AI review payload. Later you can connect Firebase Storage signed URLs." /></Grid>
        </Grid>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<AutoAwesomeOutlinedIcon />} onClick={runReview} disabled={loading}>{loading ? 'Reviewing…' : 'Review with AI'}</Button>
          <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={saveReview}>Save observation</Button>
        </Stack>
        {status ? <Alert sx={{ mt: 2 }} severity="info">{status}</Alert> : null}
      </PageSection>

      <PageSection title="Checklist" subtitle="Simple owner-side reminders before approving work.">
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {form.checklist.map((item) => <Chip key={item} label={item} />)}
        </Stack>
      </PageSection>

      <PageSection title="AI review output" subtitle="Urgent issues, worker instructions, and payment hold points.">
        {result ? (
          <Stack spacing={2}>
            <Typography>{result.summary}</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography fontWeight={700}>Urgent issues</Typography>
                <ul>{result.urgentIssues.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography fontWeight={700}>Next checks</Typography>
                <ul>{result.nextChecks.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography fontWeight={700}>Worker instructions</Typography>
                <ul>{result.workerInstructions.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography fontWeight={700}>Payment hold points</Typography>
                <ul>{result.paymentHoldPoints.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Alert severity="info">Review a site observation to generate owner-friendly QA advice.</Alert>
        )}
      </PageSection>
    </Stack>
  );
}
