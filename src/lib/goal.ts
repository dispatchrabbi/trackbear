import { Goal } from 'src/lib/api/goal.ts';
import { GOAL_CADENCE_UNIT_INFO, GOAL_TYPE, GoalHabitParameters, GoalTargetParameters } from 'server/lib/models/goal.ts';
import { formatCount } from './tally.ts';

export function cmpGoal(a: Goal, b: Goal) {
  if(a.starred !== b.starred) {
    return a.starred ? -1 : 1;
  }

  if(a.endDate < b.endDate) {
    return -1;
  } else if(a.endDate > b.endDate) {
    return 1;
  }

  const aTitle = a.title.toLowerCase();
  const bTitle = b.title.toLowerCase();
  return aTitle < bTitle ? -1 : aTitle > bTitle ? 1 : 0;
}

export function describeGoal(goal: Goal) {
  if(goal.type === GOAL_TYPE.TARGET) {
    const params = goal.parameters as GoalTargetParameters;

    let description = `Reach ${formatCount(params.threshold.count, params.threshold.measure)}`;
    if(goal.endDate) {
      description += ` by ${goal.endDate}`;
    }

    return description;
  } else if(goal.type === GOAL_TYPE.HABIT) {
    const params = goal.parameters as GoalHabitParameters;

    const threshold = params.threshold ? formatCount(params.threshold.count, params.threshold.measure) : 'something';
    const cadence = params.cadence.period === 1 ? GOAL_CADENCE_UNIT_INFO[params.cadence.unit].label.singular : `${params.cadence.period} ${GOAL_CADENCE_UNIT_INFO[params.cadence.unit].label.plural}`;
    const description = `Log ${threshold} every ${cadence}`;

    return description;
  } else {
    return 'Mystery goal!';
  }
}