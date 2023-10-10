import React from 'react';

import { AttributeScore } from './AttributeScore';

interface DetailScoresProps {
  scores?: Score[];
  benchmark?: Attributes;
}

export const DetailScores = ({ scores, benchmark }: DetailScoresProps) => {
  const getUserData = (attrName: string) => {
    return benchmark![attrName as keyof Attributes];
  };
  return (
    <div style={{ padding: '0px 10px' }}>
      {scores?.map((entry, index) => (
        <AttributeScore score={entry} index={index} key={index} userPref={benchmark && getUserData(entry.name)} />
      ))}
    </div>
  );
};
