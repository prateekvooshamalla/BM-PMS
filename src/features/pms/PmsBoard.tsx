import { Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { EstimateResult } from '../../types';
import { PageSection } from '../../components/common/PageSection';

const columns: EstimateResult['tasks'][number]['status'][] = ['todo', 'in_progress', 'blocked', 'done'];

export function PmsBoard({ result }: { result: EstimateResult }) {
  return (
    <PageSection title="PMS board" subtitle="Simple owner-side Kanban generated from the estimate.">
      <Grid container spacing={2}>
        {columns.map((status) => (
          <Grid size={{ xs: 12, md: 6, lg: 3 }} key={status}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>{status.replace('_', ' ').toUpperCase()}</Typography>
              {result.tasks.filter((task) => task.status === status).map((task) => (
                <Stack key={task.id} spacing={0.5} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Typography fontWeight={700}>{task.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{task.phaseName} · {task.owner}</Typography>
                  <Typography variant="body2">{task.durationDays} days</Typography>
                  <Typography variant="caption" color="text.secondary">Depends on: {task.dependencyTaskIds?.join(', ') || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">QA: {task.qaCheckpoint || '—'}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        ))}
      </Grid>
    </PageSection>
  );
}
