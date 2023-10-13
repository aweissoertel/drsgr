import React, { useRef, useState } from 'react';

import { Badge, Button, OverlayTrigger, Stack, Tooltip } from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';

import { MethodContext } from '../shared/MethodContext';
import ResultInfo from './ResultInfo';

interface ResultsProps {
  results: FullCountry[];
  stay: number;
  aggregatedProfile?: Attributes;
  // activeResult: number;
}

export const Results = ({ results, stay, aggregatedProfile }: ResultsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const accordElem = useRef<HTMLDivElement>(null);
  const isNotAGMPreferences = React.useContext(MethodContext) !== 'preferences';

  return (
    <div style={{ padding: '10px 0' }}>
      <h4>Best destinations for your group:</h4>
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
                  {isNotAGMPreferences && <Favorites item={item} />}
                </Accordion.Header>
                <Accordion.Body>
                  <ResultInfo country={item} stay={stay} benchmark={aggregatedProfile} />
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

interface FavoritesProps {
  item: FullCountry;
}

const Favorites = ({ item }: FavoritesProps) => {
  return (
    <Stack direction='horizontal' gap={2} style={{ marginLeft: 16 }}>
      {item.favorites.best.length > 0 && (
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              This would be the best destination for {item.favorites.best.length} member(s) of your group: {item.favorites.best.join(', ')}
            </Tooltip>
          }
        >
          <Button disabled variant='info' size='sm' as='div' style={{ pointerEvents: 'none' }}>
            Best <Badge bg='dark'>{item.favorites.best.length}</Badge>
          </Button>
        </OverlayTrigger>
      )}
      {item.favorites.second.length > 0 && (
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              This would be the second best destination for {item.favorites.second.length} member(s) of your group:{' '}
              {item.favorites.second.join(', ')}
            </Tooltip>
          }
        >
          <Button disabled variant='success' size='sm' as='div'>
            Second <Badge bg='dark'>{item.favorites.second.length}</Badge>
          </Button>
        </OverlayTrigger>
      )}
      {item.favorites.third.length > 0 && (
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              This would be the third best destination for {item.favorites.third.length} member(s) of your group:{' '}
              {item.favorites.third.join(', ')}
            </Tooltip>
          }
        >
          <Button disabled variant='warning' size='sm' as='div'>
            Third <Badge bg='dark'>{item.favorites.third.length}</Badge>
          </Button>
        </OverlayTrigger>
      )}
      {item.favorites.topFive.length > 0 && (
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              This would be one of the top 5 destination for {item.favorites.topFive.length} member(s) of your group:{' '}
              {item.favorites.topFive.join(', ')}
            </Tooltip>
          }
        >
          <Button disabled variant='secondary' size='sm' as='div'>
            Top 5 <Badge bg='dark'>{item.favorites.topFive.length}</Badge>
          </Button>
        </OverlayTrigger>
      )}
    </Stack>
  );
};
