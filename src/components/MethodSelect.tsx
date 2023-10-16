import * as React from 'react';

import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BiInfoCircle } from 'react-icons/bi';

import { MethodContext } from '../shared/MethodContext';
import { APMethods, ARMethods } from '../shared/constants';
import { getAggregatedInput, getAggregationStrategy } from '../shared/util';
import { DetailScores } from './DetailScores';

export interface MethodSelectProps {
  item: GroupRecommendation;
  setCurrentAResult: React.Dispatch<React.SetStateAction<RankResult[] | undefined>>;
  aggregatedProfile?: Attributes;
  setAggregatedProfile: React.Dispatch<React.SetStateAction<Attributes | undefined>>;
  setAGMethod: React.Dispatch<React.SetStateAction<string>>;
  ignoreBudget: boolean;
  setIgnoreBudget: React.Dispatch<React.SetStateAction<boolean>>;
}

const MethodSelect = React.memo(function MethodSelect({
  item,
  setCurrentAResult,
  aggregatedProfile,
  setAggregatedProfile,
  setAGMethod,
  ignoreBudget,
  setIgnoreBudget,
}: MethodSelectProps) {
  const [strategy, setStrategy] = React.useState<string>('average');
  const [showProfile, setShowProfile] = React.useState(false);

  const AGMethod = React.useContext(MethodContext);

  const handleAGMethodSwitch = (value: string) => {
    setAGMethod(value);
    if (value === 'preferences') {
      setCurrentAResult(item.aggregationResultsAP?.find((strat) => strat.method === strategy)?.rankedCountries);
    } else {
      setCurrentAResult(item.aggregationResultsAR?.find((strat) => strat.method === strategy)?.rankedCountries);
    }
    handleShowAPSwitch();
  };

  const handleStrategySwitch = (value: string) => {
    setStrategy(value);
    if (AGMethod === 'preferences') {
      setCurrentAResult(item.aggregationResultsAP?.find((strat) => strat.method === value)?.rankedCountries);
      const aInput = item.aggregatedInput![getAggregatedInput(value)] as Attributes;
      setAggregatedProfile(aInput);
    } else {
      setCurrentAResult(item.aggregationResultsAR?.find((strat) => strat.method === value)?.rankedCountries);
    }
  };

  const handleGoBackButton = async () => {
    const response = await fetch(`/recommendationreset?id=${item.id}`, { method: 'PUT' });
    if (response.ok) {
      location.reload();
    } else {
      console.log('error:', response);
    }
  };

  const handleShowAPSwitch = () => {
    if (showProfile) {
      setAggregatedProfile(undefined);
      setShowProfile(false);
    } else {
      const aInput = item.aggregatedInput![getAggregatedInput(strategy)] as Attributes;
      setAggregatedProfile(aInput);
      setShowProfile(true);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                  - Aggregating Profiles: The profile of preferences of every user get aggregated into a combined profile of the group. The
                  destination recommendation list for this group is matched from this combined profile with its preferences.
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
      <Form.Select
        defaultValue='preferences'
        aria-label='Aggregation Method'
        onChange={(e) => handleAGMethodSwitch(e.target.value)}
        name='Aggregation Method'
      >
        <option value='results'>Aggregating Results</option>
        <option value='preferences'>Aggregating Profiles</option>
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
      <Form.Select
        defaultValue='average'
        aria-label='Aggregation Strategy'
        onChange={(e) => handleStrategySwitch(e.target.value)}
        name='Aggregation Strategy'
      >
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
      <Form.Switch
        className='mt-2'
        label='Exclude destinations above budget'
        checked={!ignoreBudget}
        onChange={() => setIgnoreBudget((val) => !val)}
        id='ignoreBudget'
      />
      {AGMethod === 'preferences' && (
        <>
          <hr />
          <Form.Switch
            label='Show aggregated profile'
            checked={showProfile}
            onChange={() => handleShowAPSwitch()}
            id='Show aggregated profile'
            className='mb-2'
          />
          {showProfile && aggregatedProfile && (
            <div className='bg-dark p-2 mt-2 mb-2 border rounded'>
              <DetailScores
                groupProfileMode
                scores={Object.keys(aggregatedProfile).map((key) => ({
                  name: key,
                  value: aggregatedProfile[key as keyof AggregatedInput],
                }))}
              />
            </div>
          )}
        </>
      )}
      <Button onClick={() => handleGoBackButton()} variant='danger' className='mt-auto'>
        Go back to vote phase
      </Button>
    </div>
  );
});
export default MethodSelect;
