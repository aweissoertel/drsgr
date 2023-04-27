import React, { useState, useEffect, useRef } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import ResultInfo from './components/ResultInfo';

interface ResultsProps {
  results: CompleteResult[];
  stay: number;
  activeResult: number;
  userData: UserPreferences;
}

export const Results = ({ results, stay, activeResult, userData }: ResultsProps) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const accordElem = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (results.length > 0) {
      if (activeResult === activeIndex) {
        setActiveIndex(-1);
      } else {
        setActiveIndex(activeResult);
        accordElem.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'start',
        });
      }
    }
  }, [activeResult]);
  return (
    <div style={{ padding: '10px 0', height: '100%', overflow: 'hidden' }}>
      <p style={{ textAlign: 'left' }}>Best destinations for you:</p>
      {results.length > 0 ? (
        <div style={{ overflow: 'auto', height: '90%' }} ref={accordElem}>
          <Accordion activeKey={activeIndex.toString()}>
            {results?.map((item, index) => (
              <Accordion.Item eventKey={index.toString()} key={index}>
                <Accordion.Header
                  onClick={() => {
                    if (index === activeIndex) {
                      setActiveIndex(-1);
                    } else {
                      setActiveIndex(index);
                      accordElem.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest',
                      });
                    }
                  }}
                >
                  {index + 1}. {item.region}
                </Accordion.Header>
                <Accordion.Body>
                  <ResultInfo country={item} label={index + 1} stay={stay} userData={userData} />
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      ) : (
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'center',
            flexDirection: 'column',
          }}
        >
          <p style={{ fontWeight: 'bold', color: 'red' }}>No results found!</p>
        </div>
      )}
    </div>
  );
};
