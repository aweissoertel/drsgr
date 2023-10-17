import React, { useRef, useState } from 'react';

import { Badge, Button, OverlayTrigger, Stack, Tooltip } from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';

import { MethodContext } from '../shared/MethodContext';
import ResultInfo from './ResultInfo';

interface ResultsProps {
  results: FullCountry[];
  stay: number;
  aggregatedProfile?: Attributes;
  openVoteModal: (u_name: string) => void;
  openConfirmModal: () => void;
}

export const Results = ({ results, stay, aggregatedProfile, openVoteModal, openConfirmModal }: ResultsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const accordElem = useRef<HTMLDivElement>(null);
  const isNotAGMPreferences = React.useContext(MethodContext) !== 'preferences';

  const handleClick = (index: number) => {
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h4>Best destinations for your group:</h4>
      {results.length > 0 ? (
        <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }} ref={accordElem}>
          <Accordion activeKey={activeIndex.toString()}>
            {results.slice(0, 10).map((item, index) => (
              <Accordion.Item eventKey={index.toString()} key={index}>
                <Accordion.Header onClick={() => handleClick(index)}>
                  {index + 1}. {item.name}
                  {isNotAGMPreferences && <Favorites item={item} onClick={() => handleClick(index)} />}
                </Accordion.Header>
                <Accordion.Body>
                  <ResultInfo openVoteModal={openVoteModal} country={item} stay={stay} benchmark={aggregatedProfile} />
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
      <Button onClick={openConfirmModal} variant='success' style={{ marginTop: 'auto', width: '100%' }}>
        Conclude Session
      </Button>
    </div>
  );
};

interface FavoritesProps {
  item: FullCountry;
  onClick: () => void;
}

const Favorites = ({ item, onClick }: FavoritesProps) => {
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
          <Button disabled variant='info' size='sm' as='div' onClick={onClick}>
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
          <Button disabled variant='success' size='sm' as='div' onClick={onClick}>
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
          <Button disabled variant='warning' size='sm' as='div' onClick={onClick}>
            Third <Badge bg='dark'>{item.favorites.third.length}</Badge>
          </Button>
        </OverlayTrigger>
      )}
      {item.favorites.topTen.length > 0 && (
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              This would be one of the top ten destination for {item.favorites.topTen.length} member(s) of your group:{' '}
              {item.favorites.topTen.join(', ')}
            </Tooltip>
          }
        >
          <Button disabled variant='secondary' size='sm' as='div' onClick={onClick}>
            Top 10 <Badge bg='dark'>{item.favorites.topTen.length}</Badge>
          </Button>
        </OverlayTrigger>
      )}
    </Stack>
  );
};
