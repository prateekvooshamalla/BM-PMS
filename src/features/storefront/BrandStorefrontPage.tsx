import { Chip, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { popularBrands } from '../../data/defaults';
import { PageSection } from '../../components/common/PageSection';

const categories = ['cement', 'steel', 'plumbing', 'electrical', 'paint', 'tiles', 'waterproofing'] as const;

export function BrandStorefrontPage() {
  return (
    <Stack spacing={3}>
      <PageSection title="Popular brands storefront" subtitle="A simple owner-side shortlist by category. Use this for comparison, not as a substitute for site verification.">
        <Typography color="text.secondary">Each card shows why the brand is popular, where it fits best, and what to verify before approval.</Typography>
      </PageSection>
      {categories.map((category) => (
        <PageSection key={category} title={category.charAt(0).toUpperCase() + category.slice(1)} subtitle="Popular options to compare during procurement.">
          <Grid container spacing={2}>
            {popularBrands.filter((item) => item.category === category).map((item) => (
              <Grid key={item.id} size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.25} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <div>
                      <Typography fontWeight={700}>{item.brand}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.productLine}</Typography>
                    </div>
                    <Chip size="small" label={item.positioning} />
                  </Stack>
                  <Typography variant="body2">{item.whyPopular}</Typography>
                  <Typography variant="body2" color="text.secondary">Best for: {item.bestFor}</Typography>
                  <Stack spacing={0.5}>
                    {item.notes.map((note) => <Typography key={note} variant="caption" color="text.secondary">• {note}</Typography>)}
                  </Stack>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </PageSection>
      ))}
    </Stack>
  );
}
