import { Alert, Chip, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import PlumbingOutlinedIcon from '@mui/icons-material/PlumbingOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import { EstimateResult, ProjectInput, UserRole } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { PageSection } from '../../components/common/PageSection';

const roleBlocks: Record<UserRole, string[]> = {
  owner: [
    'Focus on red flags, payment hold points, and scope gaps before releasing money.',
    'Use the quote comparison page to negotiate based on scope and brand mismatch, not only final amount.',
    'Use site QA before plastering, flooring, and fixture closure so mistakes are visible early.',
  ],
  admin: [
    'Keep city, labour, and material masters updated before new estimates are generated.',
    'Use market refresh for a pricing signal, then manually approve the final base rates.',
    'Standardize plumbing, electrical, and quality guidance to reduce team variance.',
  ],
  contractor: [
    'Use the PMS tasks and procurement timing to stage labour and materials correctly.',
    'Close QA checkpoints with photos before asking for milestone release.',
    'Align vendor quotes with the generated BOQ so hidden exclusions are obvious.',
  ],
};

export function DashboardPage({
  result,
  input,
  saveStatus,
  aiLoading,
  role,
  activeProjectId,
}: {
  result: EstimateResult;
  input: ProjectInput;
  saveStatus: string;
  aiLoading: boolean;
  role: UserRole;
  activeProjectId?: string;
}) {
  const totalWater = result.waterPlan.reduce((sum, row) => sum + row.totalLitres, 0);
  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h4">{input.projectName}</Typography>
          <Typography color="text.secondary">{input.location} · {input.builtUpSft} sft · {input.bedrooms} bed · {input.bathrooms} bath</Typography>
        </div>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip icon={<AutoAwesomeOutlinedIcon />} label={aiLoading ? 'AI analyzing…' : 'AI ready'} color={aiLoading ? 'warning' : 'success'} />
          <Chip icon={<WaterDropOutlinedIcon />} label={`${totalWater.toLocaleString('en-IN')} L water plan`} />
          <Chip icon={<PlumbingOutlinedIcon />} label={`${result.plumbingPlan.length} plumbing line items`} />
          <Chip icon={<EngineeringOutlinedIcon />} label={`${result.tasks.length} PMS tasks`} />
          <Chip label={activeProjectId ? 'Saved project linked' : 'Save project to enable quote/site history'} color={activeProjectId ? 'success' : 'warning'} />
        </Stack>
      </Stack>

      {saveStatus ? <Alert severity="info">{saveStatus}</Alert> : null}

      <Grid container spacing={2.5}>
        {result.summary.map((item) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.label}>
            <StatCard label={item.label} value={item.value} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <PageSection title="Why this estimate is more than a calculator" subtitle="The engine combines rules, location factors, labour sequencing, quote comparison, site QA, and AI commentary.">
            <Stack spacing={1.25}>
              <Typography>• Location changes city factors, water cost, tanker assumptions, labour multipliers, and transport sensitivity.</Typography>
              <Typography>• Detailed plans are generated for water, plumbing, labour deployment, PMS tasks, procurement timing, and quality checkpoints.</Typography>
              <Typography>• OpenAI is used for analysis, fraud checks, market signals, quote comparison, site review, and narrative reporting — not for raw arithmetic alone.</Typography>
              <Typography>• Admin masters support market-assisted rate refresh plus manual overrides.</Typography>
            </Stack>
          </PageSection>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <PageSection title={`${role.charAt(0).toUpperCase() + role.slice(1)} view`} subtitle="Starter role-specific guidance for the current workspace.">
            <Stack spacing={1.25}>
              {roleBlocks[role].map((point) => <Typography key={point}>• {point}</Typography>)}
            </Stack>
          </PageSection>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageSection title="Top quality checks" subtitle="Owner-side checks to reduce rework and cheating.">
            <Stack spacing={1.5}>
              {result.qualityChecks.slice(0, 4).map((item) => (
                <div key={item.title}>
                  <Typography fontWeight={700}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.trade} · {item.checkWhen}</Typography>
                  <Typography variant="body2">{item.howToVerify}</Typography>
                </div>
              ))}
            </Stack>
          </PageSection>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageSection title="Procurement timing" subtitle="Order only when the next stage is actually ready.">
            <Stack spacing={1.5}>
              {result.procurementPlan.slice(0, 4).map((item) => (
                <div key={item.id}>
                  <Typography fontWeight={700}>{item.itemGroup} · day {item.triggerDay}</Typography>
                  <Typography variant="body2">{item.whyNow}</Typography>
                  <Typography variant="caption" color="text.secondary">Hold point: {item.holdPoint}</Typography>
                </div>
              ))}
            </Stack>
          </PageSection>
        </Grid>
      </Grid>
    </Stack>
  );
}
