import React, { useRef, useState } from 'react';

import Accordion from 'react-bootstrap/Accordion';

import ResultInfo from './ResultInfo';

interface ResultsProps {
  results: FullCountry[];
  stay: number;
  // activeResult: number;
}

export const Results = ({ results, stay }: ResultsProps) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const accordElem = useRef<HTMLDivElement>(null);
  // useEffect(() => {
  //   if (results.length > 0) {
  //     if (activeResult === activeIndex) {
  //       setActiveIndex(-1);
  //     } else {
  //       setActiveIndex(activeResult);
  //       accordElem.current?.scrollIntoView({
  //         behavior: 'smooth',
  //         block: 'end',
  //         inline: 'start',
  //       });
  //     }
  //   }
  // }, [activeResult]);
  return (
    <div style={{ padding: '10px 0' }}>
      <h4 style={{ textAlign: 'left' }}>Best destinations for you:</h4>
      {results.length > 0 ? (
        <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }} ref={accordElem}>
          <Accordion activeKey={activeIndex.toString()}>
            {results.slice(0, 10).map((item, index) => (
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
                  {index + 1}. {item.name}
                </Accordion.Header>
                <Accordion.Body>
                  <ResultInfo country={item} stay={stay} />
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
