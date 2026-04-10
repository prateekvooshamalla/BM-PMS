import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

const checks = [
  {
    title: "Auth and access",
    items: [
      "Enable Phone auth and add only production domains plus localhost.",
      "Create user profiles on first login and promote admins deliberately.",
      "Verify SMS templates, billing, quota alerts, and abuse monitoring before launch.",
    ],
  },
  {
    title: "Data and storage",
    items: [
      "Deploy Firestore rules, indexes, and Storage rules from this repo.",
      "Seed real city, material, labour, and verified supplier masters before go-live.",
      "Test floor-plan uploads and report export against production buckets.",
    ],
  },
  {
    title: "Functions and AI",
    items: [
      "Set OPENAI_API_KEY and model envs in the Functions environment.",
      "Keep verified supplier pricing as the source of truth and AI market study as advisory.",
      "Turn on App Check enforcement after observing valid traffic in staging.",
    ],
  },
  {
    title: "Release discipline",
    items: [
      "Run emulator rule tests and a staging smoke pass before each production deploy.",
      "Use the CI workflow in .github/workflows/ci.yml for build and rules validation.",
      "Store printable reports from saved Firestore records, not transient UI state.",
    ],
  },
];

export function DeploymentPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="h4">Deployment readiness</Typography>
          <Chip color="primary" label="V2.9 pass" />
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Use this page as the final release checklist for auth, rules, hosting,
          callable functions, and verified market data.
        </Typography>
      </Box>

      <Alert severity="info">
        This app is designed so production numbers come from admin-controlled
        masters and verified supplier entries. AI analysis adds reasoning and
        market-study assistance, but it is not the final authority for committed
        rates.
      </Alert>

      <Grid container spacing={2.5}>
        {checks.map((group) => (
          <Grid size={{ xs: 12, md: 6 }} key={group.title}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6">{group.title}</Typography>
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  {group.items.map((item) => (
                    <Box
                      key={item}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6">Suggested deployment sequence</Typography>
          <Stack spacing={1.25} sx={{ mt: 2 }}>
            {[
              "1. Configure Firebase project, auth domains, App Check key, and billing.",
              "2. Deploy Firestore indexes and security rules, then Storage rules.",
              "3. Deploy Functions with OpenAI credentials and test callable auth.",
              "4. Seed admin masters and verified supplier prices.",
              "5. Run emulator rules tests, staging smoke test, and production rollout.",
            ].map((step) => (
              <Box key={step} sx={{ py: 1.25 }}>
                <Typography variant="body2">{step}</Typography>
              </Box>
            ))}
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              href="https://firebase.google.com/docs"
              target="_blank"
              rel="noreferrer"
            >
              Firebase docs
            </Button>
            <Button
              variant="outlined"
              href="https://platform.openai.com/docs"
              target="_blank"
              rel="noreferrer"
            >
              OpenAI docs
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
