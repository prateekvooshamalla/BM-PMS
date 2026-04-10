import { EstimateResult } from '../../types';
import { Card } from '../../components/ui';

const columns: EstimateResult['tasks'][number]['status'][] = ['todo', 'in_progress', 'blocked', 'done'];

export function PmsBoard({ result }: { result: EstimateResult }) {
  return (
    <div className="stack gap">
      <Card title="PMS board">
        <div className="board">
          {columns.map((status) => (
            <div key={status} className="stack gap">
              <h4>{status.replace('_', ' ').toUpperCase()}</h4>
              {result.tasks.filter((task) => task.status === status).map((task) => (
                <div key={task.id} className="ticket">
                  <strong>{task.name}</strong>
                  <span>{task.phaseName}</span>
                  <small>{task.owner} · {task.durationDays} days</small>
                  <small>Depends on: {task.dependencyTaskIds?.join(', ') || '—'}</small>
                  <small>QA: {task.qaCheckpoint ?? '—'}</small>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
