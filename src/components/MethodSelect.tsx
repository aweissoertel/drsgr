import * as React from 'react';

import { Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BiInfoCircle } from 'react-icons/bi';

import { APMethods, ARMethods } from '../shared/constants';
import { getAggregatedInput, getAggregationStrategy } from '../shared/util';
import { DetailScores } from './DetailScores';

export interface MethodSelectProps {
  item: GroupRecommendation;
  setCurrentAResult: React.Dispatch<React.SetStateAction<RankResult[] | undefined>>;
}

const MethodSelect = React.memo(function MethodSelect({ item, setCurrentAResult }: MethodSelectProps) {
  const [AGMethod, setAGMethod] = React.useState<string>('preferences');
  const [strategy, setStrategy] = React.useState<string>('average');
  const [showUserVotes, setShowUserVotes] = React.useState(false);

  React.useEffect(() => {
    setCurrentAResult(
      AGMethod === 'preferences'
        ? item.aggregationResultsAP?.find((strat) => strat.method === strategy)?.rankedCountries
        : item.aggregationResultsAR?.find((strat) => strat.method === strategy)?.rankedCountries,
    );
  }, [AGMethod, strategy]);

  return (
    <>
      <h4 style={{ marginBottom: '1rem' }}>Setttings</h4>
      <p style={{ marginBottom: '0.5rem' }}>
        Choose the aggregation method{' '}
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              <div>
                <p>The aggregation method defines which dimension is aggregated.</p>
                <p>
                  - Aggregating Results: First, a ranked list of destinations is created for every user based on the user&apos;s
                  preferences. Then, these lists of destinations get aggregated into one list, representing the group&apos;s preferences.
                </p>
                <p>
                  - Aggregating Preferences: The preferences of every user get aggregated into combined preferences of the group. The
                  destination recommendation list for this group is matched from these combined preferences.
                </p>
              </div>
            </Tooltip>
          }
        >
          <span>
            <BiInfoCircle />
          </span>
        </OverlayTrigger>
      </p>
      <Form.Select defaultValue='preferences' aria-label='Aggregation Method' onChange={(e) => setAGMethod(e.target.value)}>
        <option value='results'>Aggregating Results</option>
        <option value='preferences'>Aggregating Preferences</option>
      </Form.Select>
      <p style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>
        Choose the aggregation strategy{' '}
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              <p>The aggregation algorithm used.</p>
            </Tooltip>
          }
        >
          <span>
            <BiInfoCircle />
          </span>
        </OverlayTrigger>
      </p>
      <Form.Select defaultValue='average' aria-label='Aggregation Strategy' onChange={(e) => setStrategy(e.target.value)}>
        <option>Select...</option>
        {AGMethod === 'results'
          ? ARMethods.map((method, idx) => (
              <option key={idx} value={method}>
                {getAggregationStrategy(method)}
              </option>
            ))
          : APMethods.map((method, idx) => (
              <option key={idx} value={method}>
                {getAggregationStrategy(method)}
              </option>
            ))}
      </Form.Select>
      {AGMethod === 'preferences' && (
        <>
          <hr />
          <Form.Switch label='Show aggregated user votes' checked={showUserVotes} onChange={() => setShowUserVotes((p) => !p)} />
          {showUserVotes && (
            <div className='bg-dark p-2 mt-2 border rounded'>
              <DetailScores
                scores={Object.keys(item.aggregatedInput![getAggregatedInput(strategy)]).map((key) => ({
                  name: key,
                  value: item.aggregatedInput![getAggregatedInput(strategy)][key as keyof AggregatedInput],
                }))}
              />
            </div>
          )}
        </>
      )}
    </>
  );
});
export default MethodSelect;
