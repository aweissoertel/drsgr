import React from 'react';

interface IndexLabelProps {
  ind: number;
}

export const IndexLabel = ({ ind }: IndexLabelProps) => {
  return (
    <div>
      <h4>{ind + 1}</h4>
    </div>
  );
};
