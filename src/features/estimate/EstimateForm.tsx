import { defaultProjectInput } from '../../data/defaults';
import { ProjectInput } from '../../types';
import { InputField, SelectField, ToggleField } from '../../components/form';
import { Button, Card } from '../../components/ui';

export function EstimateForm({ input, setInput, onGenerate }: { input: ProjectInput; setInput: (next: ProjectInput) => void; onGenerate: () => void; }) {
  const update = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setInput({ ...input, [key]: value });
  return (
    <div className="stack gap">
      <Card title="Core project details">
        <div className="grid cols2 gap">
          <InputField label="Project name" value={input.projectName} onChange={(v) => update('projectName', v)} />
          <InputField label="Location" value={input.location} onChange={(v) => update('location', v)} />
          <InputField label="Built-up sft" type="number" value={input.builtUpSft} onChange={(v) => update('builtUpSft', Number(v))} />
          <InputField label="Floors" type="number" value={input.floors} onChange={(v) => update('floors', Number(v))} />
          <InputField label="Bedrooms" type="number" value={input.bedrooms} onChange={(v) => update('bedrooms', Number(v))} />
          <InputField label="Bathrooms" type="number" value={input.bathrooms} onChange={(v) => update('bathrooms', Number(v))} />
          <InputField label="Kitchens" type="number" value={input.kitchenCount} onChange={(v) => update('kitchenCount', Number(v))} />
          <InputField label="Utility points" type="number" value={input.utilityPoints} onChange={(v) => update('utilityPoints', Number(v))} />
          <InputField label="Balconies" type="number" value={input.balconyCount} onChange={(v) => update('balconyCount', Number(v))} />
          <InputField label="Ceiling height ft" type="number" value={input.ceilingHeightFt} onChange={(v) => update('ceilingHeightFt', Number(v))} />
          <InputField label="Overhead tank litres" type="number" value={input.overheadTankLitres} onChange={(v) => update('overheadTankLitres', Number(v))} />
          <SelectField label="Property type" value={input.propertyType} onChange={(v) => update('propertyType', v as ProjectInput['propertyType'])} options={[{ label: 'Independent House', value: 'independent_house' }, { label: 'Duplex', value: 'duplex' }, { label: 'Villa', value: 'villa' }]} />
        </div>
      </Card>

      <Card title="Construction and services">
        <div className="grid cols2 gap">
          <SelectField label="Quality" value={input.qualityLevel} onChange={(v) => update('qualityLevel', v as ProjectInput['qualityLevel'])} options={[{ label: 'Basic', value: 'basic' }, { label: 'Standard', value: 'standard' }, { label: 'Premium', value: 'premium' }]} />
          <SelectField label="Wall type" value={input.wallType} onChange={(v) => update('wallType', v as ProjectInput['wallType'])} options={[{ label: 'Red Brick', value: 'red_brick' }, { label: 'AAC Block', value: 'aac_block' }]} />
          <SelectField label="Foundation" value={input.foundationType} onChange={(v) => update('foundationType', v as ProjectInput['foundationType'])} options={[{ label: 'Standard', value: 'standard' }, { label: 'Soft Soil', value: 'soft_soil' }, { label: 'Rocky', value: 'rocky' }]} />
          <SelectField label="Slab" value={input.slabType} onChange={(v) => update('slabType', v as ProjectInput['slabType'])} options={[{ label: 'RCC Flat', value: 'rcc_flat' }, { label: 'RCC Premium', value: 'rcc_premium' }]} />
          <SelectField label="Water source" value={input.waterSource} onChange={(v) => update('waterSource', v as ProjectInput['waterSource'])} options={[{ label: 'Municipal', value: 'municipal' }, { label: 'Tanker', value: 'tanker' }, { label: 'Borewell', value: 'borewell' }, { label: 'Mixed', value: 'mixed' }]} />
          <SelectField label="Sewage type" value={input.sewageType} onChange={(v) => update('sewageType', v as ProjectInput['sewageType'])} options={[{ label: 'Municipal', value: 'municipal' }, { label: 'Septic', value: 'septic' }]} />
          <SelectField label="Plumbing tier" value={input.plumbingTier} onChange={(v) => update('plumbingTier', v as ProjectInput['plumbingTier'])} options={[{ label: 'Economy', value: 'economy' }, { label: 'Standard', value: 'standard' }, { label: 'Premium', value: 'premium' }]} />
          <SelectField label="Electrical tier" value={input.electricalTier} onChange={(v) => update('electricalTier', v as ProjectInput['electricalTier'])} options={[{ label: 'Economy', value: 'economy' }, { label: 'Standard', value: 'standard' }, { label: 'Premium', value: 'premium' }]} />
        </div>
      </Card>

      <Card title="Optional scope switches">
        <div className="grid cols2 gap">
          <ToggleField label="Compound wall" checked={input.includeCompoundWall} onChange={(v) => update('includeCompoundWall', v)} />
          <ToggleField label="Sump" checked={input.includeSump} onChange={(v) => update('includeSump', v)} />
          <ToggleField label="Septic tank" checked={input.includeSepticTank} onChange={(v) => update('includeSepticTank', v)} />
          <ToggleField label="Borewell" checked={input.includeBorewell} onChange={(v) => update('includeBorewell', v)} />
          <ToggleField label="Parking" checked={input.parking} onChange={(v) => update('parking', v)} />
          <ToggleField label="Vastu priority" checked={input.vastuPriority} onChange={(v) => update('vastuPriority', v)} />
        </div>
      </Card>

      <div className="row gap fullWidth">
        <Button onClick={onGenerate}>Generate V2.2</Button>
        <Button className="secondary" onClick={() => setInput(defaultProjectInput)}>Reset</Button>
      </div>
    </div>
  );
}
