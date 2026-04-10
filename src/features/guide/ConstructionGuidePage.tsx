import { Chip, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { EstimateResult } from '../../types';
import { PageSection } from '../../components/common/PageSection';

export function ConstructionGuidePage({ result }: { result: EstimateResult }) {
  return (
    <Stack spacing={3}>
      <PageSection title="Step-by-step construction guide" subtitle="A simple sequence from start to handover, generated from the current estimate.">
        <Typography color="text.secondary">Use this as the owner-side execution map. Each stage includes timing, deliverables, and the key things to check before paying.</Typography>
      </PageSection>
      <Grid container spacing={2}>
        {result.phases.map((phase) => (
          <Grid size={{ xs: 12, md: 6 }} key={phase.id}>
            <Stack spacing={1.25} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <div>
                  <Typography fontWeight={700}>{phase.name}</Typography>
                  <Typography variant="body2" color="text.secondary">Day {phase.startDay} to {phase.endDay} · {phase.durationDays} days</Typography>
                </div>
                <Chip size="small" label={`${result.tasks.filter((task) => task.phaseId === phase.id).length} tasks`} />
              </Stack>
              <Stack spacing={0.5}>
                {phase.deliverables.map((item) => <Typography key={item} variant="body2">• {item}</Typography>)}
              </Stack>
              <Typography variant="caption" color="text.secondary">Dependencies: {phase.dependencies.join(', ') || 'Project start'}</Typography>
              <Typography variant="caption" color="text.secondary">Owner checks: {result.tasks.filter((task) => task.phaseId === phase.id).map((task) => task.qaCheckpoint).filter(Boolean).slice(0, 2).join(' · ') || 'Verify workmanship before releasing payment.'}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
