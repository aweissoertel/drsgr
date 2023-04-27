import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col } from "react-bootstrap";
import Map from "../MapView/Map";
import Preferences from "../PreferencesView/Preferences";
import { Results } from "../ResultsView/Results";

interface TravelRecommenderProps {
  countries: MapCountry[];
  userData: UserPreferences;
  setUserData: React.Dispatch<React.SetStateAction<UserPreferences>>;
  results: CompleteResult[];
}

const TravelRecommender = ({ countries, userData, setUserData, results }: TravelRecommenderProps) => {
  const [activeResult, setActiveResult] = useState(0);
  return (
    <div className="App">
      <Row style={{ height: "100%" }}>
        <Col style={{ height: "100%" }}>
          <Preferences
            userData={userData}
            setUserData={setUserData}
          ></Preferences>
        </Col>
        <Col xs={6} style={{ height: "100%" }}>
          <Map countries={countries} setActiveResult={setActiveResult} />
        </Col>
        <Col style={{ height: "100%" }}>
          <Results
            results={results}
            stay={userData.stay}
            activeResult={activeResult}
            userData={userData}
          />
        </Col>
      </Row>
    </div>
  );
};

export default TravelRecommender;
