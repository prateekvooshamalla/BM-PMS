import { Box, Card, CardContent, CardHeader, Divider, Typography } from '@mui/material';
import { PropsWithChildren } from 'react';

export function PageSection({ title, subtitle, actions, children }: PropsWithChildren<{ title: string; subtitle?: string; actions?: React.ReactNode }>) {
  return (
    <Card>
      <CardHeader
        sx={{ pb: 1.5 }}
        title={<Typography variant="h6">{title}</Typography>}
        subheader={subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : undefined}
        action={actions ? <Box sx={{ pt: 0.5 }}>{actions}</Box> : undefined}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>{children}</CardContent>
    </Card>
  );
}
