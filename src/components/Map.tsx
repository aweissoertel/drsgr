import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';

import { Map as IMAP, LatLngExpression, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJSON, MapContainer } from 'react-leaflet';

import { IndexLabel } from '../views/MapView/components/IndexLabel';
import Legend from '../views/MapView/components/Legend';
import { CountryPopup } from './CountryPopup';
import './styles/Map.css';

const position: LatLngExpression = [51.0967884, 5.9671304];

interface MapProps {
  countries: FullCountry[];
}

const Map = ({ countries }: MapProps) => {
  const [, setActiveCountry] = useState(-1);
  const [map, setMap] = useState<IMAP | undefined>(undefined);
  const geoJsonLayer = useRef<any>(null);

  useEffect(() => {
    if (geoJsonLayer.current) {
      geoJsonLayer.current.clearLayers().addData(countries);
    }
  }, [geoJsonLayer.current]);

  //feature: Feature<Geometry, any>, layer: Layer
  const onEachCountry: any = (country: FullCountry, layer: any) => {
    const c = countries.findIndex((r) => r.properties.u_name === country.properties.u_name);
    const score = country.rankResult.totalScore;
    layer.options.fillColor = getColor(score);
    const popupContent = ReactDOMServer.renderToString(<CountryPopup country={country} />);
    layer.bindPopup(popupContent, {
      // direction: "auto",
      keepInView: true,
    });
    const tooltipContent = ReactDOMServer.renderToString(<IndexLabel ind={c} />);

    if (c < 10 && score > 0) {
      layer.options.fillColor = getColor(100);
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

  const getColor = (d: number) => {
    return d > 90 ? '#109146' : d > 70 ? '#7CBA43' : d > 60 ? '#FFCC06' : d > 50 ? '#F58E1D' : d >= 0 ? '#BF1E24' : '#fff';
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
      <GeoJSON ref={geoJsonLayer} style={countryStyle} data={countries as any} onEachFeature={onEachCountry} />
      <Legend map={map} />
    </MapContainer>
  );
};

export default Map;
