import React from 'react';

import L, { Map } from 'leaflet';

interface LegendProps {
  map?: Map;
}

function Legend({ map }: LegendProps) {
  const getColor = (d: number) => {
    return d > 90 ? '#109146' : d > 70 ? '#7CBA43' : d > 60 ? '#FFCC06' : d > 50 ? '#F58E1D' : d >= 0 ? '#BF1E24' : '#fff';
  };
  React.useEffect(() => {
    if (map) {
      const legend = L.control.attribution({ position: 'bottomleft' });

      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [100, 90, 70, 60, 50];
        const texts = ['Excellent', 'Good', 'Fair', 'Uncertain', 'Poor'];
        const labels: string[] = [];

        grades.map((grade, idx) => {
          labels.push('<i style="background:' + getColor(grade) + '"></i> ' + texts[idx]);
        });

        div.innerHTML = labels.join('<br>');
        return div;
      };

      legend.addTo(map);
    }
  }, [map]);
  return null;
}

export default Legend;
