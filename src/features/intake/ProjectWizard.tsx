import React from 'react';
import { Box, Button, FormControlLabel, MenuItem, Step, StepLabel, Stepper, Switch, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { ProjectInput } from '../../types';

const steps = ['Project basics', 'Structure', 'Water and plumbing', 'Electrical and extras', 'Review'];

export function ProjectWizard({ input, setInput, onGenerate }: { input: ProjectInput; setInput: (next: ProjectInput) => void; onGenerate: () => void }) {
  const [activeStep, setActiveStep] = React.useState(0);
  const update = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setInput({ ...input, [key]: value });

  const canBack = activeStep > 0;
  const isLast = activeStep === steps.length - 1;

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><TextField label="Project name" fullWidth value={input.projectName} onChange={(e) => update('projectName', e.target.value)} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField label="Location" fullWidth value={input.location} onChange={(e) => update('location', e.target.value)} helperText="City or locality. This influences rate suggestions and water assumptions." /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Built-up area (sft)" fullWidth type="number" value={input.builtUpSft} onChange={(e) => update('builtUpSft', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Floors" fullWidth type="number" value={input.floors} onChange={(e) => update('floors', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Ceiling height (ft)" fullWidth type="number" value={input.ceilingHeightFt} onChange={(e) => update('ceilingHeightFt', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Property type" fullWidth value={input.propertyType} onChange={(e) => update('propertyType', e.target.value as ProjectInput['propertyType'])}><MenuItem value="independent_house">Independent house</MenuItem><MenuItem value="duplex">Duplex</MenuItem><MenuItem value="villa">Villa</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Bedrooms" fullWidth type="number" value={input.bedrooms} onChange={(e) => update('bedrooms', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Bathrooms" fullWidth type="number" value={input.bathrooms} onChange={(e) => update('bathrooms', Number(e.target.value))} /></Grid>
        </Grid>
      )}

      {activeStep === 1 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Quality level" fullWidth value={input.qualityLevel} onChange={(e) => update('qualityLevel', e.target.value as ProjectInput['qualityLevel'])}><MenuItem value="basic">Basic</MenuItem><MenuItem value="standard">Standard</MenuItem><MenuItem value="premium">Premium</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Wall type" fullWidth value={input.wallType} onChange={(e) => update('wallType', e.target.value as ProjectInput['wallType'])}><MenuItem value="red_brick">Red brick</MenuItem><MenuItem value="aac_block">AAC block</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Foundation type" fullWidth value={input.foundationType} onChange={(e) => update('foundationType', e.target.value as ProjectInput['foundationType'])}><MenuItem value="standard">Standard</MenuItem><MenuItem value="soft_soil">Soft soil</MenuItem><MenuItem value="rocky">Rocky</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Slab type" fullWidth value={input.slabType} onChange={(e) => update('slabType', e.target.value as ProjectInput['slabType'])}><MenuItem value="rcc_flat">RCC flat</MenuItem><MenuItem value="rcc_premium">RCC premium</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FormControlLabel control={<Switch checked={input.includeCompoundWall} onChange={(e) => update('includeCompoundWall', e.target.checked)} />} label="Compound wall" /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FormControlLabel control={<Switch checked={input.parking} onChange={(e) => update('parking', e.target.checked)} />} label="Parking" /></Grid>
        </Grid>
      )}

      {activeStep === 2 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Water source" fullWidth value={input.waterSource} onChange={(e) => update('waterSource', e.target.value as ProjectInput['waterSource'])}><MenuItem value="municipal">Municipal</MenuItem><MenuItem value="tanker">Tanker</MenuItem><MenuItem value="borewell">Borewell</MenuItem><MenuItem value="mixed">Mixed</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Sewage type" fullWidth value={input.sewageType} onChange={(e) => update('sewageType', e.target.value as ProjectInput['sewageType'])}><MenuItem value="municipal">Municipal</MenuItem><MenuItem value="septic">Septic</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Overhead tank litres" fullWidth type="number" value={input.overheadTankLitres} onChange={(e) => update('overheadTankLitres', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Kitchen count" fullWidth type="number" value={input.kitchenCount} onChange={(e) => update('kitchenCount', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Utility points" fullWidth type="number" value={input.utilityPoints} onChange={(e) => update('utilityPoints', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Balcony count" fullWidth type="number" value={input.balconyCount} onChange={(e) => update('balconyCount', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Plumbing tier" fullWidth value={input.plumbingTier} onChange={(e) => update('plumbingTier', e.target.value as ProjectInput['plumbingTier'])}><MenuItem value="economy">Economy</MenuItem><MenuItem value="standard">Standard</MenuItem><MenuItem value="premium">Premium</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FormControlLabel control={<Switch checked={input.includeSump} onChange={(e) => update('includeSump', e.target.checked)} />} label="Sump" /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FormControlLabel control={<Switch checked={input.includeBorewell} onChange={(e) => update('includeBorewell', e.target.checked)} />} label="Borewell" /></Grid>
        </Grid>
      )}

      {activeStep === 3 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}><TextField select label="Electrical tier" fullWidth value={input.electricalTier} onChange={(e) => update('electricalTier', e.target.value as ProjectInput['electricalTier'])}><MenuItem value="economy">Economy</MenuItem><MenuItem value="standard">Standard</MenuItem><MenuItem value="premium">Premium</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FormControlLabel control={<Switch checked={input.includeSepticTank} onChange={(e) => update('includeSepticTank', e.target.checked)} />} label="Septic tank" /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FormControlLabel control={<Switch checked={input.vastuPriority} onChange={(e) => update('vastuPriority', e.target.checked)} />} label="Vastu priority" /></Grid>
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary">The generated estimate will include detailed water timing, plumbing quantities, electrical starter plan, labour deployment, anti-fraud checks, and vastu guidance.</Typography>
          </Grid>
        </Grid>
      )}

      {activeStep === 4 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><TextField label="Location" fullWidth value={input.location} disabled /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField label="Built-up area" fullWidth value={`${input.builtUpSft} sft`} disabled /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField label="Home type" fullWidth value={`${input.bedrooms} bed / ${input.bathrooms} bath / ${input.propertyType}`} disabled /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField label="Services" fullWidth value={`${input.plumbingTier} plumbing / ${input.electricalTier} electrical / ${input.waterSource} water`} disabled /></Grid>
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary">Click Generate to refresh the estimate using the latest rates loaded from Firestore masters. If market-assisted rates were refreshed in Admin, those values are used too.</Typography>
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" disabled={!canBack} onClick={() => setActiveStep((prev) => prev - 1)}>Back</Button>
        {isLast ? (
          <Button variant="contained" onClick={onGenerate}>Generate estimate</Button>
        ) : (
          <Button variant="contained" onClick={() => setActiveStep((prev) => prev + 1)}>Next</Button>
        )}
      </Box>
    </Box>
  );
}
