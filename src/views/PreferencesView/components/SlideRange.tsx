import React, { useState } from "react";

interface SlideRangeProps {
  attrName: string;
  userData: UserPreferences;
  setUserData: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const SlideRange = ({ attrName, userData, setUserData }: SlideRangeProps) => {
  const [value, setValue] = useState(userData.attributes[attrName as keyof Attributes]);
  return (
    <form style={{ width: "100%", display: "flex" }}>
      <input
        id="slider"
        style={{ width: "100%", height: "1.5rem" }}
        type="range"
        step={25}
        value={value}
        onChange={(e) => {
          setValue(e.target.valueAsNumber);
          setUserData({
            ...userData,
            attributes: {
              ...userData.attributes,
              [attrName]: e.target.valueAsNumber,
            },
          });
        }}
      ></input>
    </form>
  );
};

export default SlideRange;
