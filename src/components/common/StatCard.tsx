import { Card, CardContent, Stack, Typography } from '@mui/material';

export function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={0.75}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h5">{value}</Typography>
          {helper ? <Typography variant="caption" color="text.secondary">{helper}</Typography> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
