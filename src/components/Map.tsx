import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';

import { Map as IMAP, LatLngExpression, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJSON, MapContainer } from 'react-leaflet';

import { MethodContext } from '../shared/MethodContext';
import { IndexLabel } from '../views/MapView/components/IndexLabel';
import Legend from '../views/MapView/components/Legend';
import { CountryPopup } from './CountryPopup';
import './styles/Map.css';

const position: LatLngExpression = [51.0967884, 5.9671304];

interface MapProps {
  countries: FullCountry[];
  ignoreBudget: boolean;
}

const Map = ({ countries, ignoreBudget }: MapProps) => {
  const [, setActiveCountry] = useState(-1);
  const [map, setMap] = useState<IMAP | undefined>(undefined);
  const geoJsonLayer = useRef<any>(null);
  const AGMethod = React.useContext(MethodContext);

  useEffect(() => {
    if (geoJsonLayer.current) {
      geoJsonLayer.current.clearLayers().addData(countries);
      geoJsonLayer.current.options.onEachFeature = onEachCountry(ignoreBudget, AGMethod);
    }
  }, [geoJsonLayer.current, countries, ignoreBudget, AGMethod]);

  //feature: Feature<Geometry, any>, layer: Layer
  const onEachCountry: any = (ignore: boolean, method: string) => (country: FullCountry, layer: any) => {
    const ind = ignore ? country.rankResult.rank - 1 : country.rankResult.rankOverBudget - 1;
    const score = country.rankResult.totalScore;
    layer.options.fillColor = getColor(
      method === 'preferences' ? score : country.rankResult.rank,
      ignore,
      country.rankResult.overBudget,
      method,
    );
    const popupContent = ReactDOMServer.renderToString(<CountryPopup country={country} nonRelative={method === 'results'} />);
    layer.bindPopup(popupContent, {
      // direction: "auto",
      keepInView: true,
    });

    if (ind < 10 && ind > -1) {
      const tooltipContent = ReactDOMServer.renderToString(<IndexLabel ind={ind} />);

      layer.bindTooltip(tooltipContent, {
        permanent: true,
        opacity: 1,
        direction: 'center',
      });
    }

    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      dblclick: clickCountry,
    });
  };

  const countryStyle = {
    fillOpacity: 1,
    color: '#868686',
    weight: 1,
  };

  const highlightFeature = (e: LeafletMouseEvent) => {
    const layer = e.target;

    layer.setStyle({
      weight: 5,
      color: 'white',
      fillOpacity: 0.7,
    });
  };

  const resetHighlight = (e: LeafletMouseEvent) => {
    const layer = e.target;
    layer.setStyle({
      fillOpacity: 1,
      color: '#868686',
      weight: 1,
    });
  };

  const clickCountry = (e: LeafletMouseEvent) => {
    const ind = countries.findIndex((r) => r.properties.u_name === e.target.feature.properties.u_name);
    if (ind < 10) {
      setActiveCountry(ind);
    } else {
      setActiveCountry(-1);
    }
  };

  const getColor = (d: number, ignoreBudet: boolean, overBudget: boolean, method: string) => {
    if (!ignoreBudet && overBudget) {
      return '#BF1E24';
    }
    if (method === 'preferences') {
      return d > 90 ? '#109146' : d > 70 ? '#7CBA43' : d > 60 ? '#FFCC06' : d > 50 ? '#F58E1D' : d >= 0 ? '#BF1E24' : '#fff';
    } else {
      return d < 32 ? '#109146' : d < 64 ? '#7CBA43' : d < 96 ? '#FFCC06' : d < 128 ? '#F58E1D' : d < 200 ? '#BF1E24' : '#fff';
    }
  };

  return (
    <MapContainer
      style={{ height: '100%', width: 'auto' }}
      zoom={4}
      center={position}
      ref={setMap as any}
      doubleClickZoom={false}
      // zoomControl={false}
      // touchZoom={false}
      // scrollWheelZoom={false}
      // boxZoom={false}
      // keyboard={false}
    >
      <GeoJSON ref={geoJsonLayer} style={countryStyle} data={countries as any} onEachFeature={onEachCountry(ignoreBudget)} />
      <Legend map={map} />
    </MapContainer>
  );
};

export default Map;
