import React, { useState, useEffect } from 'react';
import { DetailScores } from './DetailScores';
import PieChartComponent from './PieChartComponent';

interface ResultInfoProps {
  country: CompleteResult;
  label: number;
  stay: number;
  userData: UserPreferences;
}

const ResultInfo = ({ country, label, stay, userData }: ResultInfoProps) => {
  const [scores, setScores] = useState<Score[]>([]);
  const loadData = () => {
    const s = Object.keys(country.scores.attr)?.map((key) => ({
      name: key,
      value: country.scores.attr[key as keyof Attributes],
    }));
    setScores(s);
  };
  useEffect(loadData, [country]);
  return (
    <div className="dark-theme">
      <PieChartComponent scores={scores} label={label} countryName={country.country} region={country.region} />
      <p style={{ paddingTop: '10px' }}>
        Price for {stay} days: {country.price}€
      </p>
      <hr />
      <p style={{ fontSize: 'x-small' }}>
        Scores of {country.region} based on your preferences: (The bar demonstrates the score of the given attribute for{' '}
        {country.region} and the black line shows your preference - hover on the bars for more details)
      </p>
      <DetailScores
        scores={Object.keys(country.qualifications)?.map((key) => ({
          name: key,
          value: country.qualifications[key as keyof Attributes],
        }))}
        userData={userData}
      />
      <hr />
      <p>Overall score: {country.scores.totalScore}/100</p>
    </div>
  );
};

export default ResultInfo;
