import React from "react";
import { Text } from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

type BadgeColor = "blue" | "green" | "amber" | "red" | "purple";

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

const colorMap: Record<BadgeColor, { bg: string; text: string }> = {
  blue: { bg: Colors.primaryLight, text: Colors.primary },
  green: { bg: Colors.successLight, text: Colors.success },
  amber: { bg: Colors.warningLight, text: Colors.warning },
  red: { bg: Colors.errorLight, text: Colors.error },
  purple: { bg: Colors.physicsLight, text: Colors.physics },
};

const Pill = styled.View<{ bg: string }>`
  background-color: ${({ bg }) => bg};
  border-radius: 99px;
  padding: 3px 10px;
  align-self: flex-start;
`;

const PillText = styled(Text)<{ color: string }>`
  font-size: 11px;
  font-weight: 700;
  color: ${({ color }) => color};
  letter-spacing: 0.4px;
  text-transform: uppercase;
`;

export const Badge: React.FC<BadgeProps> = ({ label, color = "blue" }) => {
  const { bg, text } = colorMap[color];
  return (
    <Pill bg={bg}>
      <PillText color={text}>{label}</PillText>
    </Pill>
  );
};
