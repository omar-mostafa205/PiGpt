import React from "react";
import { Text, View } from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
}

const Circle = styled(View)<{ size: number; color: string }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: ${({ size }) => size / 2}px;
  background-color: ${({ color }) => color};
  align-items: center;
  justify-content: center;
`;

const Initials = styled(Text)<{ size: number }>`
  color: #ffffff;
  font-size: ${({ size }) => size * 0.38}px;
  font-weight: 700;
`;

export const Avatar: React.FC<AvatarProps> = ({
  initials,
  size = 40,
  color = Colors.primary,
}) => (
  <Circle size={size} color={color}>
    <Initials size={size}>{initials.slice(0, 2).toUpperCase()}</Initials>
  </Circle>
);
