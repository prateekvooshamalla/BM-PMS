import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import SecurityUpdateGoodRoundedIcon from '@mui/icons-material/SecurityUpdateGoodRounded';
import { ConfirmationResult } from 'firebase/auth';
import { clearRecaptcha, requestOtp, verifyOtp, watchAuth } from '../../lib/auth';

const steps = ['Phone verification', 'Secure OTP check', 'Workspace access'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [userReady, setUserReady] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  useEffect(
    () =>
      watchAuth((nextUser) => {
        setUser(nextUser);
        setUserReady(true);
      }),
    [],
  );

  useEffect(() => () => clearRecaptcha(), []);

  const activeStep = useMemo(() => {
    if (user) return 2;
    if (confirmation) return 1;
    return 0;
  }, [confirmation, user]);

  const sendOtp = async () => {
    try {
      setLoading(true);
      setError('');
      setInfo('Sending OTP...');
      const result = await requestOtp(phone.trim());
      setConfirmation(result);
      setInfo('OTP sent. For local development, use Firebase test numbers so you do not consume SMS quota.');
    } catch (e) {
      console.error(e);
      setError('Could not send OTP. Check Phone Auth is enabled, your web domain is authorized, and reCAPTCHA/App Check are configured.');
      setInfo('');
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async () => {
    if (!confirmation) return;
    try {
      setLoading(true);
      setError('');
      setInfo('Verifying OTP...');
      await verifyOtp(confirmation, otp.trim());
      setInfo('Signed in successfully.');
    } catch (e) {
      console.error(e);
      setError('OTP verification failed. Check the code or request a fresh OTP.');
      setInfo('');
    } finally {
      setLoading(false);
    }
  };

  if (!userReady) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading Bharat Makaan...</Typography>
        </Stack>
      </Box>
    );
  }

  if (user) return <>{children}</>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'grid', placeItems: 'center', p: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={3} alignItems="stretch">
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ borderRadius: 5, height: '100%' }}>
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Stack spacing={4}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Chip icon={<ShieldRoundedIcon />} label="Phone OTP sign-in" color="primary" />
                    <Chip variant="outlined" icon={<SecurityUpdateGoodRoundedIcon />} label="Firebase Auth + Firestore profile" />
                  </Stack>

                  <Box>
                    <Typography variant="h3">Bharat Makaan</Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1.5, maxWidth: 720 }}>
                      Clean owner-side construction intelligence with floor plan uploads, market-aware estimating, AI analysis, and print-ready project records from the database.
                    </Typography>
                  </Box>

                  <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <TextField
                        label="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        fullWidth
                        helperText="Use E.164 format, for example +919876543210"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Button fullWidth variant="contained" startIcon={<PhoneAndroidRoundedIcon />} onClick={sendOtp} disabled={loading || phone.trim().length < 10} sx={{ height: 56 }}>
                        Send OTP
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <div id="recaptcha-container" />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <TextField
                        label="OTP code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        fullWidth
                        disabled={!confirmation}
                        helperText={confirmation ? 'Enter the 6-digit code sent to this number.' : 'Send OTP first to unlock verification.'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Button fullWidth variant="outlined" startIcon={<LoginRoundedIcon />} onClick={confirmOtp} disabled={loading || !confirmation || otp.trim().length < 6} sx={{ height: 56 }}>
                        Verify and continue
                      </Button>
                    </Grid>
                  </Grid>

                  {info ? <Alert severity="info">{info}</Alert> : null}
                  {error ? <Alert severity="error">{error}</Alert> : null}

                  <Divider />

                  <Grid container spacing={2}>
                    {[
                      ['No guest mode', 'Users only enter through OTP sign-in. All projects, uploads, and printable reports are tied to the authenticated account.'],
                      ['Database-first printing', 'Print and export flows read saved Firestore records instead of scraping the current screen state.'],
                      ['Protected backend path', 'Callable functions can require auth and App Check so OpenAI and pricing workflows are not publicly exposed.'],
                    ].map(([title, desc]) => (
                      <Grid size={{ xs: 12, md: 4 }} key={title}>
                        <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                          <Typography variant="subtitle1">{title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{desc}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ borderRadius: 5, height: '100%' }}>
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Stack spacing={2.5}>
                  <Typography variant="h5">Production hardening checklist baked into this revision</Typography>
                  <Typography variant="body2" color="text.secondary">
                    This build is tightened for real deployment: auth persistence, role-backed route control, hardened rules, emulator testing scaffolds, App Check support, and verified supplier pricing workflows alongside AI market study.
                  </Typography>
                  <Stack spacing={1.5}>
                    {[
                      'Enable Phone sign-in and add only your production domains plus localhost during development.',
                      'Set an App Check site key on web and enforce it on Functions, Firestore, and Storage once traffic looks healthy.',
                      'Run emulator-based rules tests before every deploy.',
                      'Use verified supplier quotes or dealer calls for final procurement; AI market study is advisory, not contractual pricing.',
                    ].map((item) => (
                      <Box key={item} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
