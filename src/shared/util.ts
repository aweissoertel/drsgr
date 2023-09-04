export const getAggregationStrategy = (input: string) => {
  switch (input) {
    case 'multiplicative':
      return 'Multiplicative';
    case 'average':
      return 'Average';
    case 'bordaCount':
      return 'Borda Count';
    case 'mostPleasure':
      return 'Most Pleasure';
    case 'withoutMisery':
      return 'Average Without Misery';
    default:
      return 'not found';
  }
};

export const getAggregatedInput = (select: string): keyof AggregatedInput => {
  switch (select) {
    case 'multiplicative':
      return 'multiAP';
    case 'bordaCount':
      return 'bordaCountAP';
    case 'mostPleasure':
      return 'mostPleasureAP';
    case 'average':
    default:
      return 'averageAP';
  }
};
