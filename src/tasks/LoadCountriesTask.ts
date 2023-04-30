import papa from 'papaparse';

import regionModel from '../data/regionModel';
import mapData from '../data/regions.json';

class LoadCountriesTask {
  allResults: CompleteResult[] = [];
  mapCountries = mapData.features as MapCountry[];
  load = (setFileRetrieved: React.Dispatch<React.SetStateAction<RawCountries[]>>) => {
    papa.parse<RawCountries>(regionModel, {
      header: true,
      complete: (result) => {
        setFileRetrieved(result.data);
      },
    });
  };
  processCountries = (
    countryScores: RawCountries[],
    userData: UserPreferences,
    setCountries: React.Dispatch<React.SetStateAction<MapCountry[]>>,
    setResults: React.Dispatch<React.SetStateAction<CompleteResult[]>>,
  ) => {
    this.mapCountries.map((mapCountry) => {
      const scoreCountry = countryScores.find((c) => c.u_name === mapCountry.properties.u_name);
      if (scoreCountry != null) {
        const res: CompleteResult = {
          country: scoreCountry.ParentRegion,
          region: scoreCountry.Region,
          uname: scoreCountry.u_name,
          price: Math.ceil(((scoreCountry.costPerWeek || 400) * userData.stay) / 7),
          qualifications: {
            nature: this.calculateQualification(scoreCountry.nature),
            architecture: this.calculateQualification(scoreCountry.architecture),
            hiking: this.calculateQualification(scoreCountry.hiking),
            wintersports: this.calculateQualification(scoreCountry.wintersports),
            beach: this.calculateQualification(scoreCountry.beach),
            culture: this.calculateQualification(scoreCountry.culture),
            culinary: this.calculateQualification(scoreCountry.culinary),
            entertainment: this.calculateQualification(scoreCountry.entertainment),
            shopping: this.calculateQualification(scoreCountry.shopping),
          },
          scores: {
            totalScore: 0,
            attr: {
              nature: 0,
              architecture: 0,
              hiking: 0,
              wintersports: 0,
              beach: 0,
              culture: 0,
              culinary: 0,
              entertainment: 0,
              shopping: 0,
            },
          },
        };
        const budgetScore = this.calculatePriceScore(res.price, userData.budget);
        const isAffordable = !userData.isPriceImportant || budgetScore === 100;
        mapCountry.properties.country = scoreCountry.ParentRegion;
        mapCountry.properties.name = scoreCountry.Region;
        // calculate the score for nature
        res.scores.attr.nature = this.calculateAttributeScore(res.qualifications.nature, userData.attributes.nature);
        res.scores.attr.architecture = this.calculateAttributeScore(
          res.qualifications.architecture,
          userData.attributes.architecture,
        );
        res.scores.attr.hiking = this.calculateAttributeScore(res.qualifications.hiking, userData.attributes.hiking);
        res.scores.attr.wintersports = this.calculateAttributeScore(
          res.qualifications.wintersports,
          userData.attributes.wintersports,
        );
        res.scores.attr.beach = this.calculateAttributeScore(res.qualifications.beach, userData.attributes.beach);
        res.scores.attr.culture = this.calculateAttributeScore(res.qualifications.culture, userData.attributes.culture);
        res.scores.attr.culinary = this.calculateAttributeScore(
          res.qualifications.culinary,
          userData.attributes.culinary,
        );
        res.scores.attr.entertainment = this.calculateAttributeScore(
          res.qualifications.entertainment,
          userData.attributes.entertainment,
        );
        res.scores.attr.shopping = this.calculateAttributeScore(
          res.qualifications.shopping,
          userData.attributes.shopping,
        );

        const totalScore = isAffordable
          ? (res.scores.attr.nature +
              res.scores.attr.architecture +
              res.scores.attr.hiking +
              res.scores.attr.wintersports +
              res.scores.attr.beach +
              res.scores.attr.culture +
              res.scores.attr.culinary +
              res.scores.attr.entertainment +
              res.scores.attr.shopping +
              budgetScore) /
            10
          : 0;

        res.scores.totalScore = totalScore;
        mapCountry.properties.result = res;
        this.allResults.push(res);
      }
    });
    this.mapCountries.sort(
      (a, b) => (b.properties.result?.scores.totalScore || 0) - (a.properties.result?.scores.totalScore || 0),
    );
    setCountries(this.mapCountries);
    this.allResults.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
    this.allResults = this.allResults.filter((a) => a.scores.totalScore > 0);
    setResults(this.allResults.slice(0, 10));
  };
  calculateQualification = (qualification: string) => {
    let numScore;
    switch (qualification) {
      case '--':
        numScore = 0;
        break;
      case '-':
        numScore = 25;
        break;
      case 'o':
        numScore = 50;
        break;
      case '+':
        numScore = 75;
        break;
      case '++':
        numScore = 100;
        break;
      default:
        numScore = 50;
    }
    return numScore;
  };
  calculateAttributeScore = (countryScore: number, userScore: number) => {
    return 100 - Math.abs(userScore - countryScore);
  };
  calculatePriceScore = (countryPrice: number, userBudget: number) => {
    //change price per week to # days that user going to stay
    const maxBudget = this.getBudgetCeiling(userBudget);
    if (countryPrice <= maxBudget) {
      return 100;
    }
    // const pGroup = this.getPriceGroup(price);
    return 0;
  };

  // calculateTimingScore = (country, userData) => {};
  getPriceGroup = (price: number) => {
    if (price <= 100) {
      return 1;
    } else if (price > 100 && price <= 300) {
      return 2;
    } else if (price > 300 && price <= 500) {
      return 3;
    } else if (price > 500 && price <= 1000) {
      return 4;
    } else if (price > 1000 && price <= 2000) {
      return 5;
    } else {
      return 6;
    }
  };
  getBudgetCeiling = (budget: number) => {
    let maxBudget = 0;
    switch (budget) {
      case 1:
        maxBudget = 100;
        break;
      case 2:
        maxBudget = 300;
        break;
      case 3:
        maxBudget = 500;
        break;
      case 4:
        maxBudget = 1000;
        break;
      case 5:
        maxBudget = 2000;
        break;
      case 6:
        maxBudget = Number.MAX_VALUE;
        break;
      default:
        break;
    }
    return maxBudget;
  };
}

export default LoadCountriesTask;
