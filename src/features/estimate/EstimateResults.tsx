import { useMemo, useState } from 'react';
import { EstimateResult } from '../../types';
import { inr } from '../../lib/utils';
import { Button, Card, SegmentedTabs, Stat } from '../../components/ui';

export function EstimateResults({ result, onSave, onPdf, saveStatus, onAnalyzeAI, aiLoading }: { result: EstimateResult; onSave: () => void; onPdf: () => void; saveStatus: string; onAnalyzeAI: () => void; aiLoading: boolean; }) {
  const totalWater = result.waterPlan.reduce((sum, row) => sum + row.totalLitres, 0);
  const [tab, setTab] = useState('overview');
  const tabs = useMemo(() => [
    { label: 'Overview', value: 'overview' },
    { label: 'BOQ', value: 'boq' },
    { label: 'Services', value: 'services' },
    { label: 'Execution', value: 'execution' },
    { label: 'AI Review', value: 'ai' },
  ], []);

  return (
    <div id="report-root" className="stack gap">
      <div className="statsGrid">
        <Stat label="Total cost" value={inr(result.totalCost)} hint="Estimated construction" />
        <Stat label="Cost / sft" value={inr(result.costPerSft)} hint="Location-aware planning value" />
        <Stat label="Water plan" value={`${Math.round(totalWater / 1000)} KL`} hint="Stage-wise usage" />
        <Stat label="Service points" value={`${result.plumbingPlan.length + result.electricalPlan.length}`} hint="Plumbing + electrical detail" />
      </div>

      <Card title="Summary" actions={<div className="row gap wrap"><Button onClick={onSave}>Save</Button><Button onClick={onAnalyzeAI}>{aiLoading ? 'Analyzing...' : 'Analyze with OpenAI'}</Button><Button className="secondary" onClick={onPdf}>Export PDF</Button></div>}>
        <div className="miniGrid">{result.summary.map((item) => <Stat key={item.label} label={item.label} value={item.value} />)}</div>
        {saveStatus && <p className="muted">{saveStatus}</p>}
      </Card>

      <Card title="Planner workspace">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      </Card>

      {tab === 'overview' && (
        <>
          <div className="grid cols2 gap">
            <Card title="Cost breakup">
              <table className="table"><thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead><tbody>{result.breakdown.map((row) => <tr key={row.category}><td>{row.category}</td><td>{inr(row.amount)}</td><td>{row.percentage}%</td></tr>)}</tbody></table>
            </Card>
            <Card title="Phase plan">
              <table className="table"><thead><tr><th>Phase</th><th>Days</th><th>Window</th><th>Depends on</th></tr></thead><tbody>{result.phases.map((phase) => <tr key={phase.id}><td>{phase.name}</td><td>{phase.durationDays}</td><td>{phase.startDay}-{phase.endDay}</td><td>{phase.dependencies.join(', ') || '-'}</td></tr>)}</tbody></table>
            </Card>
          </div>
          <div className="grid cols2 gap">
            <Card title="Quality, worker risk, vastu">
              <div className="stack gap">{result.insights.map((block) => <div key={block.title}><h4>{block.title}</h4><ul>{block.points.map((point) => <li key={point}>{point}</li>)}</ul></div>)}</div>
            </Card>
            <Card title="Quality checklist by stage">
              <div className="stack gap">{result.qualityChecks.map((item) => <div key={item.title} className="checkRow"><strong>{item.title}</strong><p>{item.trade} · {item.checkWhen}</p><p>{item.howToVerify}</p></div>)}</div>
            </Card>
          </div>
        </>
      )}

      {tab === 'boq' && (
        <>
          <Card title="Material BOQ">
            <table className="table"><thead><tr><th>Item</th><th>Stage</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Note</th></tr></thead><tbody>{result.materials.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.stage ?? '-'}</td><td>{item.quantity} {item.unit}</td><td>{inr(item.rate)}</td><td>{inr(item.amount)}</td><td>{item.note ?? '-'}</td></tr>)}</tbody></table>
          </Card>
          <Card title="Procurement tracker">
            <table className="table"><thead><tr><th>Stage</th><th>Trigger day</th><th>Group</th><th>Why now</th><th>Hold point</th></tr></thead><tbody>{result.procurementPlan.map((item) => <tr key={item.id}><td>{item.stage}</td><td>Day {item.triggerDay}</td><td>{item.itemGroup}<br /><small>{item.quantityHint}</small></td><td>{item.whyNow}</td><td>{item.holdPoint}</td></tr>)}</tbody></table>
          </Card>
        </>
      )}

      {tab === 'services' && (
        <>
          <div className="grid cols2 gap">
            <Card title="Water plan">
              <table className="table"><thead><tr><th>Stage</th><th>L/day</th><th>Days</th><th>Total</th><th>Use</th></tr></thead><tbody>{result.waterPlan.map((item) => <tr key={item.stage}><td>{item.stage}</td><td>{item.litresPerDay}</td><td>{item.days}</td><td>{item.totalLitres}</td><td>{item.useCase}</td></tr>)}</tbody></table>
            </Card>
            <Card title="Detailed plumbing plan">
              <table className="table"><thead><tr><th>Item</th><th>Qty</th><th>Stage</th><th>Selection</th><th>Inspection</th></tr></thead><tbody>{result.plumbingPlan.map((item) => <tr key={item.code}><td>{item.name}</td><td>{item.quantity} {item.unit}</td><td>{item.installStage}</td><td>{item.selectionGuide}</td><td>{item.inspectionPoint}</td></tr>)}</tbody></table>
            </Card>
          </div>
          <Card title="Electrical detail starter plan">
            <table className="table"><thead><tr><th>Item</th><th>Qty</th><th>Stage</th><th>Recommendation</th><th>QA check</th></tr></thead><tbody>{result.electricalPlan.map((item) => <tr key={item.code}><td>{item.name}</td><td>{item.quantity} {item.unit}</td><td>{item.stage}</td><td>{item.recommendation}</td><td>{item.qaCheck}</td></tr>)}</tbody></table>
          </Card>
        </>
      )}

      {tab === 'execution' && (
        <>
          <div className="grid cols2 gap">
            <Card title="Labour deployment">
              <table className="table"><thead><tr><th>Team</th><th>Stage</th><th>Count</th><th>Days</th><th>Window</th></tr></thead><tbody>{result.labour.map((item) => <tr key={item.labourType}><td>{item.labourType}</td><td>{item.stage}</td><td>{item.count}</td><td>{item.days}</td><td>{item.deploymentWindow}</td></tr>)}</tbody></table>
            </Card>
            <Card title="Task dependency map">
              <table className="table"><thead><tr><th>Task</th><th>Owner</th><th>Depends on</th><th>QA checkpoint</th></tr></thead><tbody>{result.tasks.map((task) => <tr key={task.id}><td>{task.name}</td><td>{task.owner}</td><td>{task.dependencyTaskIds?.join(', ') || '-'}</td><td>{task.qaCheckpoint ?? '-'}</td></tr>)}</tbody></table>
            </Card>
          </div>
        </>
      )}

      {tab === 'ai' && result.aiAnalysis && (
        <Card title="OpenAI analysis">
          <p>{result.aiAnalysis.summary}</p>
          <div className="grid cols2 gap">
            <div><h4>Risks</h4><ul>{result.aiAnalysis.risks.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><h4>Opportunities</h4><ul>{result.aiAnalysis.opportunities.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><h4>Procurement notes</h4><ul>{result.aiAnalysis.procurementNotes.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><h4>Payment release checks</h4><ul>{result.aiAnalysis.paymentReleaseChecks.map((x) => <li key={x}>{x}</li>)}</ul></div>
            {result.aiAnalysis.locationInsights && <div><h4>Location insights</h4><ul>{result.aiAnalysis.locationInsights.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {result.aiAnalysis.plumbingInsights && <div><h4>Plumbing insights</h4><ul>{result.aiAnalysis.plumbingInsights.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {result.aiAnalysis.electricalInsights && <div><h4>Electrical insights</h4><ul>{result.aiAnalysis.electricalInsights.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {result.aiAnalysis.ownerQuestions && <div><h4>Owner questions</h4><ul>{result.aiAnalysis.ownerQuestions.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          </div>
        </Card>
      )}
    </div>
  );
}
