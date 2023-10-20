import * as React from 'react';

import { Button } from 'react-bootstrap';

import { MethodContext } from '../shared/MethodContext';
import { DetailScores } from './DetailScores';

// import PieChartComponent from '../views/ResultsView/components/PieChartComponent';

interface ResultInfoProps {
  country: FullCountry;
  stay: number;
  openVoteModal?: (u_name: string) => void;
  benchmark?: Attributes;
  isFinalResultMode?: boolean;
}

const ResultInfo = ({ country, stay, openVoteModal, benchmark, isFinalResultMode = false }: ResultInfoProps) => {
  const isAGMPreferences = React.useContext(MethodContext) === 'preferences';

  return (
    <div>
      {/* <PieChartComponent scores={scores} label={label} countryName={country.country} region={country.region} /> */}
      {!isFinalResultMode && (
        <>
          <p>
            {country.name}, {country.parentRegion}
          </p>
          <p style={{ fontSize: 'small' }}>
            Price for {stay} days: {Math.round((country.costPerWeek / 7) * stay)}€
          </p>
          <hr />
          <p style={{ fontSize: 'x-small' }}>
            {isAGMPreferences
              ? `Scores of ${country.name} based on the aggregated profile of your group: The bar demonstrates the score of the given attribute for ${country.name} and
            if you enabled visibility of aggregated profile, the black line shows the preference of your group - hover on the bars for more details`
              : `Score of ${country.name} based on the aggregated results of your group: The bar demonstrates the score of the given attribute for ${country.name} and
            at the bottom, you can see the overall scrore for ${country.name} and your group. The larger, the better.`}
          </p>
        </>
      )}
      <DetailScores
        scores={Object.keys(country.attributes)?.map((key) => ({
          name: key,
          value: country.attributes[key as keyof Attributes],
        }))}
        benchmark={isAGMPreferences ? benchmark : undefined}
      />
      {!isFinalResultMode && (
        <>
          <hr />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>
              Overall score: {country.rankResult.totalScore.toFixed(2)}
              {isAGMPreferences && '/100'}
            </span>
            {openVoteModal && (
              <Button onClick={() => openVoteModal(country.properties.u_name)} size='sm' style={{ marginLeft: 'auto' }}>
                Vote for this destination
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ResultInfo;
