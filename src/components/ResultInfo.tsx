import * as React from 'react';

import { DetailScores } from './DetailScores';
// import PieChartComponent from '../views/ResultsView/components/PieChartComponent';

interface ResultInfoProps {
  country: FullCountry;
  stay: number;
}

const ResultInfo = ({ country, stay }: ResultInfoProps) => {
  // const [scores, setScores] = useState<Score[]>([]);
  // const loadData = () => {
  //   const s = Object.keys(country.scores.attr)?.map((key) => ({
  //     name: key,
  //     value: country.scores.attr[key as keyof Attributes],
  //   }));
  //   setScores(s);
  // };
  // useEffect(loadData, [country]);
  return (
    <div>
      {/* <PieChartComponent scores={scores} label={label} countryName={country.country} region={country.region} /> */}
      <p>
        {country.name}, {country.parentRegion}
      </p>
      <p style={{ fontSize: 'small' }}>
        Price for {stay} days: {country.costPerWeek}€
      </p>
      <hr />
      <p style={{ fontSize: 'x-small' }}>
        Scores of {country.name} based on your preferences: (The bar demonstrates the score of the given attribute for {country.name} and
        the black line shows your preference - hover on the bars for more details)
      </p>
      <DetailScores
        scores={Object.keys(country.attributes)?.map((key) => ({
          name: key,
          value: country.attributes[key as keyof Attributes],
        }))}
      />
      <hr />
      <p>Overall score: {country.rankResult.totalScore.toFixed(2)}/100</p>
    </div>
  );
};

export default ResultInfo;
