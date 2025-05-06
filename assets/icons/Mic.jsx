import React from 'react';
import Svg, { Path } from 'react-native-svg';

const Mic = ({ color = '#000', height = 24, width = 24, strokeWidth = 2 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1C10.8954 1 10 1.89543 10 3V11C10 12.1046 10.8954 13 12 13C13.1046 13 14 12.1046 14 11V3C14 1.89543 13.1046 1 12 1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 10V11C18 14.3137 15.3137 17 12 17C8.68629 17 6 14.3137 6 11V10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17V21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 21H16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Mic; 