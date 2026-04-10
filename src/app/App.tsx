import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ImageSearchOutlinedIcon from '@mui/icons-material/ImageSearchOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { emptyProjectInput } from '../data/defaults';
import { generateEstimate } from '../lib/estimateEngine';
import { exportProjectRecordToPdf } from '../lib/pdf';
import { auth } from '../lib/firebase';
import { getProject, listCityRates, listLabourRates, listMaterialRates, saveAnalysisReport, saveProject } from '../lib/firestoreService';
import { logout } from '../lib/auth';
import { watchUserProfile } from '../lib/userProfile';
import { analyzeProjectWithAI } from '../lib/ai';
import { AIAnalysis, CityRate, LabourRate, MaterialRate, ProjectInput, UserProfile, UserRole } from '../types';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EstimateWorkspace } from '../features/dashboard/EstimateWorkspace';
import { PmsBoard } from '../features/pms/PmsBoard';
import { ProjectsPage } from '../features/projects/ProjectsPage';
import { AdminPage } from '../features/admin/AdminPage';
import { VendorQuotesPage } from '../features/vendor/VendorQuotesPage';
import { SiteQaPage } from '../features/site/SiteQaPage';
import { BrandStorefrontPage } from '../features/storefront/BrandStorefrontPage';
import { FloorPlanPage } from '../features/floorplan/FloorPlanPage';
import { ConstructionGuidePage } from '../features/guide/ConstructionGuidePage';
import { DeploymentPage } from '../features/deployment/DeploymentPage';

const drawerWidth = 292;

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <ListItemButton component={RouterLink} to={to} selected={active} sx={{ borderRadius: 2, mb: 0.5 }}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

function AccessDenied() {
  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', py: 8 }}>
      <Alert severity="warning">This page is limited to workspace admins. Assign the admin role in the user profile or custom claims before retrying.</Alert>
    </Box>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [input, setInput] = useState<ProjectInput>(emptyProjectInput);
  const [saveStatus, setSaveStatus] = useState('');
  const [version, setVersion] = useState(0);
  const [cityRates, setCityRates] = useState<CityRate[]>([]);
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>([]);
  const [labourRates, setLabourRates] = useState<LabourRate[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | undefined>(undefined);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const role: UserRole = profile?.role || 'owner';

  const loadMasters = async () => {
    const [cities, materials, labour] = await Promise.all([listCityRates(), listMaterialRates(), listLabourRates()]);
    setCityRates(cities);
    setMaterialRates(materials);
    setLabourRates(labour);
  };

  useEffect(() => {
    loadMasters().catch(() => setSaveStatus('Could not load master data. Check auth, rules, and Firestore setup.'));
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return undefined;
    return watchUserProfile(uid, setProfile);
  }, []);

  const result = useMemo(() => {
    const computed = generateEstimate(input, cityRates, materialRates, labourRates);
    return { ...computed, aiAnalysis: aiAnalysis ?? computed.aiAnalysis };
  }, [input, cityRates, materialRates, labourRates, version, aiAnalysis]);

  const mastersConfigured = cityRates.length > 0 && materialRates.length > 0 && labourRates.length > 0;

  const handleGenerate = () => {
    setVersion((prev) => prev + 1);
    setAiAnalysis(undefined);
    setSaveStatus(mastersConfigured ? 'Estimate refreshed with latest configured rates.' : 'Estimate refreshed using temporary local defaults because admin masters are not configured yet.');
  };

  const handleSave = async () => {
    try {
      setSaveStatus('Saving project, tasks, and AI report...');
      const projectId = await saveProject({ input, estimate: result });
      setActiveProjectId(projectId);
      if (result.aiAnalysis && result.aiAnalysis.status !== 'idle') {
        await saveAnalysisReport(projectId, {
          projectId,
          projectName: input.projectName,
          location: input.location,
          summary: result.aiAnalysis.summary,
          risks: result.aiAnalysis.risks,
          opportunities: result.aiAnalysis.opportunities,
        });
      }
      setSaveStatus(`Saved successfully: ${projectId}`);
    } catch {
      setSaveStatus('Save failed. Check Firebase config, auth, and rules.');
    }
  };

  const handleAnalyzeAI = async () => {
    setAiLoading(true);
    try {
      const analysis = await analyzeProjectWithAI({ input, estimate: result });
      setAiAnalysis(analysis);
      setSaveStatus('AI analysis refreshed using the secured callable OpenAI function.');
    } catch {
      setSaveStatus('AI analysis failed. Deploy functions, set OPENAI_API_KEY, and verify App Check if enforcement is enabled.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePdf = async () => {
    if (!activeProjectId) {
      setSaveStatus('Save the project first. Print uses the saved Firestore record, not the on-screen state.');
      return;
    }
    try {
      const record = await getProject(activeProjectId);
      if (!record) throw new Error('Missing project');
      exportProjectRecordToPdf(record, `${record.input.projectName.replace(/\s+/g, '-').toLowerCase()}-v2-8.pdf`);
      setSaveStatus('Printable PDF exported from the saved Firestore record.');
    } catch {
      setSaveStatus('Could not load saved project for printing.');
    }
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={1.25}>
          <Typography variant="h6">Bharat Makaan</Typography>
          <Typography variant="body2" color="text.secondary">V2.8 hardened build</Typography>
          <Chip size="small" color="primary" icon={<AutoAwesomeOutlinedIcon />} label="Secured AI + verified pricing workflow" sx={{ width: 'fit-content' }} />
          <Chip size="small" variant="outlined" label={`Role: ${role}`} sx={{ width: 'fit-content' }} />
        </Stack>
      </Box>
      <Divider />
      <List sx={{ p: 1.5, flex: 1 }}>
        <NavItem to="/" icon={<DashboardOutlinedIcon />} label="Dashboard" />
        <NavItem to="/estimate" icon={<CalculateOutlinedIcon />} label="Estimate Wizard" />
        <NavItem to="/floor-plan" icon={<ImageSearchOutlinedIcon />} label="Floor Plan AI" />
        <NavItem to="/storefront" icon={<StorefrontOutlinedIcon />} label="Brand Storefront" />
        <NavItem to="/construction-guide" icon={<ChecklistOutlinedIcon />} label="Construction Steps" />
        <NavItem to="/quotes" icon={<RequestQuoteOutlinedIcon />} label="Quote Compare" />
        <NavItem to="/site-qa" icon={<FactCheckOutlinedIcon />} label="Site QA" />
        <NavItem to="/pms" icon={<AccountTreeOutlinedIcon />} label="PMS Board" />
        <NavItem to="/projects" icon={<FolderOpenOutlinedIcon />} label="Saved Projects" />
        {role === 'admin' ? <NavItem to="/admin" icon={<AdminPanelSettingsOutlinedIcon />} label="Admin Masters" /> : null}
        {role === 'admin' ? <NavItem to="/deployment" icon={<RocketLaunchOutlinedIcon />} label="Deployment" /> : null}
      </List>
      <Box sx={{ p: 2 }}>
        <Button variant="outlined" fullWidth onClick={() => logout()}>Logout</Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit">
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Construction intelligence workspace</Typography>
            <Typography variant="body2" color="text.secondary">Location-aware estimating, secured AI workflows, clean project planning, and database-first reporting.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {mastersConfigured ? <Chip size="small" color="success" label="Masters ready" /> : <Chip size="small" color="warning" label="Configure masters" />}
            {activeProjectId ? <Chip size="small" color="success" label="Project saved" /> : <Chip size="small" color="warning" label="Unsaved project" />}
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, mt: 9, bgcolor: 'background.default', minHeight: '100vh' }}>
        {!mastersConfigured ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Master data is not configured yet. The estimator can still show temporary local planning numbers, but save verified city, material, and labour masters before treating results as production estimates.
          </Alert>
        ) : null}
        <Routes>
          <Route path="/" element={<DashboardPage result={result} input={input} saveStatus={saveStatus} aiLoading={aiLoading} role={role} activeProjectId={activeProjectId} />} />
          <Route path="/estimate" element={<EstimateWorkspace input={input} setInput={setInput} result={result} onGenerate={handleGenerate} onSave={handleSave} onAnalyzeAI={handleAnalyzeAI} onPdf={handlePdf} saveStatus={saveStatus} aiLoading={aiLoading} />} />
          <Route path="/floor-plan" element={<FloorPlanPage input={input} setInput={setInput} activeProjectId={activeProjectId} />} />
          <Route path="/storefront" element={<BrandStorefrontPage />} />
          <Route path="/construction-guide" element={<ConstructionGuidePage result={result} />} />
          <Route path="/quotes" element={<VendorQuotesPage activeProjectId={activeProjectId} input={input} result={result} />} />
          <Route path="/site-qa" element={<SiteQaPage activeProjectId={activeProjectId} input={input} />} />
          <Route path="/pms" element={<PmsBoard result={result} />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/admin" element={role === 'admin' ? <AdminPage cityRates={cityRates} materialRates={materialRates} labourRates={labourRates} onMastersChanged={loadMasters} /> : <AccessDenied />} />
          <Route path="/deployment" element={role === 'admin' ? <DeploymentPage /> : <AccessDenied />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
