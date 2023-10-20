import * as React from 'react';

import confetti from 'canvas-confetti';
import { Button } from 'react-bootstrap';

import Delayed from '../components/Delayed';
import ResultInfo from '../components/ResultInfo';

interface ConcludedViewProps {
  item: GroupRecommendation;
  countries: FullCountry[];
  setData: React.Dispatch<React.SetStateAction<GroupRecommendation | undefined>>;
}

const ConcludedView = ({ item, countries, setData }: ConcludedViewProps) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      confetti();
    }, 2000);
    return () => clearTimeout(timer);
  });

  const goBack = async () => {
    const res = await fetch(`/reopenSession?id=${item.id}`, {
      method: 'POST',
    });
    const body = await res.json();

    setData(body);
  };

  const winner = countries.find((country) => country.properties.u_name === item.finalWinners![0].u_name)!;
  const second = countries.find((country) => country.properties.u_name === item.finalWinners![1].u_name)!;
  const third = countries.find((country) => country.properties.u_name === item.finalWinners![2].u_name)!;

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Congratulations, your group has found a destination!</h1>
      <Delayed>
        <h1>It is...</h1>
      </Delayed>
      <Delayed delay={2000}>
        <h1 style={{ marginTop: 400 }}>{winner.name}</h1>
      </Delayed>
      <Delayed delay={3000}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h6>Region of {winner.parentRegion}</h6>
          <h5>
            The cost for your {item.stayDays}-day trip will be about {Math.round((winner.costPerWeek / 7) * item.stayDays)}€ per Person.
          </h5>
          <h4>These are the details of {winner.name}:</h4>
          <div className='bg-dark p-2 mt-2 mb-2 border rounded' style={{ width: 500 }}>
            <ResultInfo country={winner} stay={item.stayDays} isFinalResultMode />
          </div>
        </div>
      </Delayed>
      <Delayed delay={6000}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100, paddingBottom: 20 }}>
          <h2>The following countries might be great alternatives:</h2>
          <h2 style={{ marginTop: 50 }}>{second.name}</h2>
          <h6>Region of {second.parentRegion}</h6>
          <h5>Costs: {Math.round((second.costPerWeek / 7) * item.stayDays)}€ per Person.</h5>
          <div className='bg-dark p-2 mt-2 mb-2 border rounded' style={{ width: 500 }}>
            <ResultInfo country={second} stay={item.stayDays} isFinalResultMode />
          </div>
          <h2 style={{ marginTop: 50 }}>{third.name}</h2>
          <h6>Region of {third.parentRegion}</h6>
          <h5>Costs: {Math.round((third.costPerWeek / 7) * item.stayDays)}€ per Person.</h5>
          <div className='bg-dark p-2 mt-2 mb-2 border rounded' style={{ width: 500 }}>
            <ResultInfo country={third} stay={item.stayDays} isFinalResultMode />
          </div>
          <Button variant='danger' onClick={goBack} style={{ marginTop: 50 }}>
            Go back and vote for other countries instead
          </Button>
        </div>
      </Delayed>
    </div>
  );
};
export default ConcludedView;
