import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: number;
}

const Track = styled(View)<{ height: number }>`
  background-color: ${Colors.borderLight};
  border-radius: 99px;
  overflow: hidden;
  height: ${({ height }) => height}px;
  width: 100%;
`;

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = Colors.primary,
  height = 8,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(Math.max(value, 0), 100),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Track height={height}>
      <Animated.View
        style={{ width, height, backgroundColor: color, borderRadius: 99 }}
      />
    </Track>
  );
};
