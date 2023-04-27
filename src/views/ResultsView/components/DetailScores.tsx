import React from 'react';
import { AttributeScore } from './AttributeScore';

interface DetailScoresProps {
  scores: Score[];
  userData: UserPreferences;
}

export const DetailScores = ({ scores, userData }: DetailScoresProps) => {
  const getUserData = (attrName: string) => {
    const key = attrName.charAt(0).toUpperCase() + attrName.slice(1);
    return userData.attributes[key as keyof Attributes];
  };
  return (
    <div style={{ padding: '0px 10px' }}>
      {scores.map((entry, index) => (
        <AttributeScore score={entry} index={index} key={index} userPref={getUserData(entry.name)} />
      ))}
    </div>
  );
};
