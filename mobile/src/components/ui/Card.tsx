import React from "react";
import { View, type ViewProps } from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

interface CardProps extends ViewProps {
  padding?: number;
  bordered?: boolean;
}

const StyledCard = styled(View)<{ padding: number; bordered: boolean }>`
  background-color: ${Colors.surface};
  border-radius: 16px;
  padding: ${({ padding }) => padding}px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.06;
  shadow-radius: 8px;
  elevation: 2;
  ${({ bordered }) =>
    bordered ? `border: 1px solid ${Colors.borderLight};` : ""}
`;

export const Card: React.FC<CardProps> = ({
  padding = 16,
  bordered = true,
  children,
  ...rest
}) => (
  <StyledCard padding={padding} bordered={bordered} {...rest}>
    {children}
  </StyledCard>
);
