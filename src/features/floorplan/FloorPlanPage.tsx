import { useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { analyzeFloorPlanWithAI } from '../../lib/ai';
import { saveFloorPlanAnalysis } from '../../lib/firestoreService';
import { uploadFloorPlan } from '../../lib/storage';
import { FloorPlanAnalysisResult, ProjectInput } from '../../types';
import { PageSection } from '../../components/common/PageSection';

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FloorPlanPage({ input, setInput, activeProjectId }: { input: ProjectInput; setInput: (next: ProjectInput) => void; activeProjectId?: string; }) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState<FloorPlanAnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPath, setUploadedPath] = useState('');

  const recommendedArea = useMemo(() => {
    if (!analysis || analysis.builtUpSftRange.max === 0) return input.builtUpSft;
    return Math.round((analysis.builtUpSftRange.min + analysis.builtUpSftRange.max) / 2);
  }, [analysis, input.builtUpSft]);

  const handleAnalyze = async () => {
    if (!file) {
      setStatus('Upload a floor plan image first.');
      return;
    }
    try {
      setLoading(true);
      setUploadProgress(0);
      if (file.type === 'application/pdf') {
        setStatus('PDF upload is stored successfully, but AI drawing extraction in this build requires an image export such as PNG or JPG.');
        setLoading(false);
        return;
      }
      setStatus('Uploading floor plan to Cloud Storage...');
      const upload = await uploadFloorPlan(file, activeProjectId, setUploadProgress);
      setUploadedPath(upload.path);
      setStatus('File uploaded. Running OpenAI floor plan analysis and BOQ extraction…');
      const imageDataUrl = await fileToDataUrl(file);
      const result = await analyzeFloorPlanWithAI({ imageDataUrl, projectName: input.projectName || 'Untitled project', location: input.location || 'Unknown', notes: `${notes}\nStorage path: ${upload.path}` });
      setAnalysis(result);
      setStatus(result.status === 'ready' ? 'Floor plan analysis is ready.' : 'Floor plan analysis returned limited confidence.');
      if (activeProjectId) {
        await saveFloorPlanAnalysis(activeProjectId, { imageName: file.name, result });
      }
    } catch (error) {
      console.error(error);
      setStatus('Floor plan upload or analysis failed. Check Storage, Functions, and OpenAI configuration.');
    } finally {
      setLoading(false);
    }
  };

  const applyToProject = () => {
    if (!analysis || analysis.status !== 'ready') return;
    setInput({
      ...input,
      builtUpSft: recommendedArea,
      bathrooms: Math.max(input.bathrooms, analysis.inferredBathrooms),
      balconyCount: Math.max(input.balconyCount, analysis.inferredBalconies),
      kitchenCount: Math.max(input.kitchenCount, analysis.inferredKitchenCount),
    });
    setStatus('Applied extracted values to the estimate wizard. Review and regenerate the project.');
  };

  return (
    <Stack spacing={3}>
      <PageSection title="Floor plan uploads" subtitle="Upload floor plan images to Cloud Storage, analyze them with OpenAI, and generate deeper quantity hints from the plan itself.">
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={2}>
              <Button component="label" variant="outlined" startIcon={<CloudUploadOutlinedIcon />} sx={{ justifyContent: 'flex-start', py: 1.4 }}>
                {file ? `Selected: ${file.name}` : 'Upload floor plan image'}
                <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
              <TextField label="Drawing notes for AI" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={4} helperText="Examples: north arrow shown, staircase in front, dimensions partly visible, parking open, utility behind kitchen." />
              <Button variant="contained" size="large" startIcon={<AutoAwesomeOutlinedIcon />} onClick={handleAnalyze} disabled={loading}>
                {loading ? 'Uploading & analyzing…' : 'Analyze floor plan'}
              </Button>
              {loading ? <LinearProgress variant="determinate" value={uploadProgress} /> : null}
              {loading ? <Typography variant="body2" color="text.secondary">Upload progress: {uploadProgress}%</Typography> : null}
              {uploadedPath ? <Alert severity="success">Stored at: {uploadedPath}</Alert> : null}
              {status ? <Alert severity="info">{status}</Alert> : null}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <PageSection title="What this gives you" subtitle="Not just room count — a better starting BOQ.">
              <Stack spacing={1}>
                <Typography variant="body2">• inferred room mix, bathroom count, kitchens, balconies</Typography>
                <Typography variant="body2">• drawing-based material adjustment hints for masonry, flooring, plumbing, wiring</Typography>
                <Typography variant="body2">• follow-up questions when dimensioning is unclear</Typography>
                <Typography variant="body2">• a reusable drawing record stored against the project</Typography>
              </Stack>
            </PageSection>
          </Grid>
        </Grid>
      </PageSection>

      {analysis ? (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PageSection title="AI extraction" subtitle="Use these values to seed the estimate.">
              <Stack spacing={1.25}>
                <Typography>{analysis.summary}</Typography>
                <Typography variant="body2" color="text.secondary">Built-up range: {analysis.builtUpSftRange.min} to {analysis.builtUpSftRange.max} sft</Typography>
                <Typography variant="body2" color="text.secondary">Bathrooms: {analysis.inferredBathrooms} · Balconies: {analysis.inferredBalconies} · Kitchens: {analysis.inferredKitchenCount}</Typography>
                <Button variant="outlined" onClick={applyToProject}>Apply to estimate wizard</Button>
              </Stack>
            </PageSection>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PageSection title="Follow-up questions" subtitle="AI asks these when the drawing is incomplete.">
              <Stack spacing={0.75}>
                {analysis.followUpQuestions.map((item) => <Typography key={item} variant="body2">• {item}</Typography>)}
              </Stack>
            </PageSection>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PageSection title="Inferred rooms" subtitle="Likely room schedule from the plan.">
              <Stack spacing={0.75}>
                {analysis.inferredRooms.map((room) => <Typography key={room.name} variant="body2">• {room.name}: {room.count}{room.approximateAreaSft ? ` (${room.approximateAreaSft} sft approx.)` : ''}</Typography>)}
              </Stack>
            </PageSection>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PageSection title="Plumbing fixtures" subtitle="Generated from the inferred bathroom + kitchen layout.">
              <Stack spacing={0.75}>
                {analysis.plumbingFixtures.map((item) => <Typography key={item.item} variant="body2">• {item.item}: {item.quantity} — {item.note}</Typography>)}
              </Stack>
            </PageSection>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PageSection title="Material adjustments" subtitle="How the plan may shift the BOQ when you regenerate.">
              <Stack spacing={0.75}>
                {analysis.materialAdjustments.map((item) => <Typography key={item.material} variant="body2">• {item.material}: {item.deltaPercentage > 0 ? '+' : ''}{item.deltaPercentage}% — {item.rationale}</Typography>)}
              </Stack>
            </PageSection>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PageSection title="Drawing-based BOQ hints" subtitle="Early quantity hints extracted from the drawing itself.">
              <Stack spacing={0.75}>
                {(analysis.boqHints || []).map((item) => <Typography key={`${item.category}-${item.item}`} variant="body2">• [{item.category}] {item.item}: {item.quantityHint} — {item.basis}. {item.note}</Typography>)}
              </Stack>
            </PageSection>
          </Grid>
        </Grid>
      ) : null}
    </Stack>
  );
}
