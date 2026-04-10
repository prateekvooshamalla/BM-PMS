import { useEffect, useState } from 'react';
import { Alert, Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { listAnalysisReports, listProjects } from '../../lib/firestoreService';
import { AnalysisReport, ProjectRecord } from '../../types';
import { PageSection } from '../../components/common/PageSection';
import { inr } from '../../lib/utils';
import { exportProjectRecordToPdf } from '../../lib/pdf';

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [status, setStatus] = useState('Loading projects…');

  useEffect(() => {
    Promise.all([listProjects(), listAnalysisReports()])
      .then(([projectRows, reportRows]) => {
        setProjects(projectRows);
        setReports(reportRows);
        setStatus(projectRows.length ? '' : 'No projects yet. Save one from the Estimate Wizard.');
      })
      .catch(() => setStatus('Could not load projects. Check Firestore rules and indexes.'));
  }, []);

  return (
    <Stack spacing={3}>
      <PageSection title="Saved projects" subtitle="Recent planning runs stored in Firestore. Print exports the saved database record, not the screen view.">
        {status ? <Alert severity="info">{status}</Alert> : null}
        <Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Location</TableCell><TableCell>Area</TableCell><TableCell>Total</TableCell><TableCell align="right">Print</TableCell></TableRow></TableHead><TableBody>{projects.map((project) => <TableRow key={project.id}><TableCell>{project.input.projectName}</TableCell><TableCell>{project.input.location}</TableCell><TableCell>{project.input.builtUpSft} sft</TableCell><TableCell>{inr(project.estimate.totalCost)}</TableCell><TableCell align="right"><Button size="small" startIcon={<PrintOutlinedIcon />} onClick={() => exportProjectRecordToPdf(project)}>Print PDF</Button></TableCell></TableRow>)}</TableBody></Table>
      </PageSection>

      <PageSection title="Saved AI reports" subtitle="Last generated OpenAI analyses.">
        <Stack spacing={2}>
          {!reports.length ? <Typography color="text.secondary">Run OpenAI analysis and save a project to start building report history.</Typography> : null}
          {reports.map((report) => (
            <Stack key={report.id} spacing={0.75} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={700}>{report.projectName}</Typography>
                <Chip size="small" label={report.location} />
              </Stack>
              <Typography variant="body2">{report.summary}</Typography>
              <Typography variant="caption" color="text.secondary">Top risk: {report.risks[0] || '—'}</Typography>
            </Stack>
          ))}
        </Stack>
      </PageSection>
    </Stack>
  );
}
