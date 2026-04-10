import { useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { ProjectWizard } from '../intake/ProjectWizard';
import { PageSection } from '../../components/common/PageSection';
import { StatCard } from '../../components/common/StatCard';
import { EstimateResult, ProjectInput } from '../../types';
import { inr } from '../../lib/utils';

function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  return value === index ? <Box sx={{ mt: 2.5 }}>{children}</Box> : null;
}

export function EstimateWorkspace({
  input,
  setInput,
  result,
  onGenerate,
  onSave,
  onAnalyzeAI,
  onPdf,
  saveStatus,
  aiLoading,
}: {
  input: ProjectInput;
  setInput: (next: ProjectInput) => void;
  result: EstimateResult;
  onGenerate: () => void;
  onSave: () => void;
  onAnalyzeAI: () => void;
  onPdf: () => void;
  saveStatus: string;
  aiLoading: boolean;
}) {
  const [tab, setTab] = useState(0);
  const totalWater = useMemo(() => result.waterPlan.reduce((sum, row) => sum + row.totalLitres, 0), [result.waterPlan]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 5 }}>
          <PageSection title="Step-by-step project wizard" subtitle="Clean intake flow instead of one large form.">
            <ProjectWizard input={input} setInput={setInput} onGenerate={onGenerate} />
          </PageSection>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              {result.summary.map((item) => (
                <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                  <StatCard label={item.label} value={item.value} />
                </Grid>
              ))}
            </Grid>
            <PageSection
              title="Actions"
              subtitle="Persist to Firestore, run OpenAI analysis, and print the saved database record."
              actions={<Stack direction="row" spacing={1}><Chip label={`${totalWater.toLocaleString('en-IN')} L`} /><Chip label={`${result.plumbingPlan.length} plumbing items`} /></Stack>}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <Button variant="contained" startIcon={<AutoAwesomeOutlinedIcon />} onClick={onAnalyzeAI} disabled={aiLoading}>{aiLoading ? 'Analyzing…' : 'Run OpenAI analysis'}</Button>
                <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={onSave}>Save project</Button>
                <Button variant="outlined" startIcon={<PictureAsPdfOutlinedIcon />} onClick={onPdf}>Print from DB</Button>
              </Stack>
              {saveStatus ? <Alert severity="info">{saveStatus}</Alert> : null}
              {aiLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={18} /><Typography variant="body2">Calling Firebase callable function for OpenAI analysis…</Typography></Stack> : null}
            </PageSection>
          </Stack>
        </Grid>
      </Grid>

      <Box id="report-root" className="report-root">
        <PageSection title="Planning workspace" subtitle="Owner-friendly tabs for cost, services, execution, and AI review.">
          <Tabs value={tab} onChange={(_, next) => setTab(next)} variant="scrollable" scrollButtons="auto">
            <Tab label="Overview" />
            <Tab label="BOQ" />
            <Tab label="Water + Plumbing" />
            <Tab label="Electrical" />
            <Tab label="Execution" />
            <Tab label="AI report" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <PageSection title="Cost breakup" subtitle="Phase-oriented summary.">
                  <Table size="small"><TableHead><TableRow><TableCell>Category</TableCell><TableCell>Amount</TableCell><TableCell>%</TableCell></TableRow></TableHead><TableBody>{result.breakdown.map((row) => <TableRow key={row.category}><TableCell>{row.category}</TableCell><TableCell>{inr(row.amount)}</TableCell><TableCell>{row.percentage}%</TableCell></TableRow>)}</TableBody></Table>
                </PageSection>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <PageSection title="Quality + worker-fraud protection" subtitle="How to compare quality and avoid being fooled.">
                  <Stack spacing={1.5}>{result.insights.map((block) => <div key={block.title}><Typography fontWeight={700}>{block.title}</Typography><ul>{block.points.map((point) => <li key={point}><Typography variant="body2">{point}</Typography></li>)}</ul></div>)}</Stack>
                </PageSection>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <PageSection title="Material BOQ" subtitle="Quantity, rate, stage, and notes.">
              <Table size="small"><TableHead><TableRow><TableCell>Item</TableCell><TableCell>Stage</TableCell><TableCell>Qty</TableCell><TableCell>Rate</TableCell><TableCell>Amount</TableCell><TableCell>Note</TableCell></TableRow></TableHead><TableBody>{result.materials.map((item) => <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell>{item.stage || '—'}</TableCell><TableCell>{item.quantity} {item.unit}</TableCell><TableCell>{inr(item.rate)}</TableCell><TableCell>{inr(item.amount)}</TableCell><TableCell>{item.note || '—'}</TableCell></TableRow>)}</TableBody></Table>
            </PageSection>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <PageSection title="Stage-wise water plan" subtitle="How many litres and when to use them.">
                  <Table size="small"><TableHead><TableRow><TableCell>Stage</TableCell><TableCell>L/day</TableCell><TableCell>Days</TableCell><TableCell>Total</TableCell></TableRow></TableHead><TableBody>{result.waterPlan.map((item) => <TableRow key={item.stage}><TableCell>{item.stage}</TableCell><TableCell>{item.litresPerDay}</TableCell><TableCell>{item.days}</TableCell><TableCell>{item.totalLitres}</TableCell></TableRow>)}</TableBody></Table>
                </PageSection>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <PageSection title="Detailed plumbing plan" subtitle="Fixtures, pipes, valves, tools, inspection points.">
                  <Table size="small"><TableHead><TableRow><TableCell>Item</TableCell><TableCell>Qty</TableCell><TableCell>Stage</TableCell><TableCell>Selection guide</TableCell><TableCell>Inspection</TableCell></TableRow></TableHead><TableBody>{result.plumbingPlan.map((item) => <TableRow key={item.code}><TableCell>{item.name}</TableCell><TableCell>{item.quantity} {item.unit}</TableCell><TableCell>{item.installStage}</TableCell><TableCell>{item.selectionGuide}</TableCell><TableCell>{item.inspectionPoint}</TableCell></TableRow>)}</TableBody></Table>
                </PageSection>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <PageSection title="Electrical starter plan" subtitle="Points, recommendations, and QA checks.">
              <Table size="small"><TableHead><TableRow><TableCell>Item</TableCell><TableCell>Qty</TableCell><TableCell>Stage</TableCell><TableCell>Recommendation</TableCell><TableCell>QA</TableCell></TableRow></TableHead><TableBody>{result.electricalPlan.map((item) => <TableRow key={item.code}><TableCell>{item.name}</TableCell><TableCell>{item.quantity} {item.unit}</TableCell><TableCell>{item.stage}</TableCell><TableCell>{item.recommendation}</TableCell><TableCell>{item.qaCheck}</TableCell></TableRow>)}</TableBody></Table>
            </PageSection>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <PageSection title="Labour deployment" subtitle="How many workers and when to deploy them.">
                  <Table size="small"><TableHead><TableRow><TableCell>Team</TableCell><TableCell>Stage</TableCell><TableCell>Count</TableCell><TableCell>Days</TableCell><TableCell>Window</TableCell></TableRow></TableHead><TableBody>{result.labour.map((item) => <TableRow key={`${item.labourType}-${item.stage}`}><TableCell>{item.labourType}</TableCell><TableCell>{item.stage}</TableCell><TableCell>{item.count}</TableCell><TableCell>{item.days}</TableCell><TableCell>{item.deploymentWindow}</TableCell></TableRow>)}</TableBody></Table>
                </PageSection>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <PageSection title="PMS tasks + dependencies" subtitle="Tasks generated from the estimate.">
                  <Table size="small"><TableHead><TableRow><TableCell>Task</TableCell><TableCell>Owner</TableCell><TableCell>Depends on</TableCell><TableCell>QA checkpoint</TableCell></TableRow></TableHead><TableBody>{result.tasks.map((task) => <TableRow key={task.id}><TableCell>{task.name}</TableCell><TableCell>{task.owner}</TableCell><TableCell>{task.dependencyTaskIds?.join(', ') || '—'}</TableCell><TableCell>{task.qaCheckpoint || '—'}</TableCell></TableRow>)}</TableBody></Table>
                </PageSection>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={5}>
            <PageSection title="OpenAI analysis" subtitle="Realtime commentary and owner questions from the callable function.">
              {result.aiAnalysis && result.aiAnalysis.status !== 'idle' ? (
                <Stack spacing={2}>
                  <Typography>{result.aiAnalysis.summary}</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight={700}>Risks</Typography>
                      <ul>{result.aiAnalysis.risks.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight={700}>Opportunities</Typography>
                      <ul>{result.aiAnalysis.opportunities.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight={700}>Procurement notes</Typography>
                      <ul>{result.aiAnalysis.procurementNotes.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight={700}>Payment release checks</Typography>
                      <ul>{result.aiAnalysis.paymentReleaseChecks.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</ul>
                    </Grid>
                  </Grid>
                </Stack>
              ) : (
                <Alert severity="info">Run OpenAI analysis to get location-sensitive commentary, procurement advice, and owner questions.</Alert>
              )}
            </PageSection>
          </TabPanel>
        </PageSection>
      </Box>
    </Stack>
  );
}
