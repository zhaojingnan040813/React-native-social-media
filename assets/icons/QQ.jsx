import React from "react";
import Svg, { Path } from "react-native-svg";

const QQ = ({ size, color, ...props }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5.5 14c-.5 1-1.5 2-3 2.5 0 0-.5 0-.5.5s0 .5.5.5c1 0 3 1 3 2s-1 1.5-3 1.5-3-1-3.5-1c-.5 0-1 0-1.5.5-.5-.5-1-.5-1.5-.5s-3 1-3.5 1-3-1-3-1.5 2-2 3-2c.5 0 .5-.5.5-.5 0-.5-.5-.5-.5-.5-1.5-.5-2.5-1.5-3-2.5-.5-1-.5-2 0-2.5.5 0 0-2 1-3.5 1-1.5 3-2.5 4.5-2 0 0 .5 0 1-.5 1 0 2 0 3 .5.5.5 1 .5 1 .5 1.5-.5 3.5.5 4.5 2 1 1.5.5 3.5 1 3.5.5.5.5 1.5 0 2.5z" />
    </Svg>
  );
};

export default QQ; 