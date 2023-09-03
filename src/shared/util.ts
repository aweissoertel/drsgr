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
