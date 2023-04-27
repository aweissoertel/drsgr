import React from "react";
import Attribute from "./Attribute";
import * as constants from "../../../data/constantData";

interface CustomizationContainerProps {
  userData: UserPreferences;
  setUserData: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

export const CustomizationContainer = ({ userData, setUserData }: CustomizationContainerProps) => {
  return (
    <div>
      <p style={{ textAlign: "start", fontSize: "small" }}>
        Rate the topics according to their importance to you:
      </p>
      {Object.keys(userData.attributes).map((item, index) => (
        <div
          style={{
            backgroundColor:
              constants.COLORS[index % constants.COLORS.length],
            borderRadius: "100",
            color: "#fff",
            textAlign: "left",
            padding: "0 5px",
            margin: "5px 0 0 0",
            height: "40px",
            alignItems: "center",
          }}
          key={index}
        >
          <Attribute
            attrName={item}
            userData={userData}
            setUserData={setUserData}
          />
        </div>
      ))}
    </div>
  );
};
