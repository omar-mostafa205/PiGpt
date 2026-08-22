import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled(TouchableOpacity)<{
  variant: Variant;
  fullWidth?: boolean;
}>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 12px 20px;
  ${({ fullWidth }) => fullWidth && "align-self: stretch;"}
  background-color: ${({ variant }) => {
    if (variant === "primary") return Colors.primary;
    if (variant === "danger") return Colors.error;
    if (variant === "secondary") return Colors.surfaceSecondary;
    return "transparent";
  }};
  border: ${({ variant }) =>
    variant === "ghost" ? `1.5px solid ${Colors.borderLight}` : "none"};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const Label = styled(Text)<{ variant: Variant }>`
  font-size: 15px;
  font-weight: 600;
  color: ${({ variant }) =>
    variant === "primary" || variant === "danger"
      ? "#ffffff"
      : Colors.textPrimary};
`;

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = "primary",
  loading = false,
  fullWidth,
  disabled,
  ...rest
}) => (
  <StyledButton
    variant={variant}
    fullWidth={fullWidth}
    disabled={disabled || loading}
    activeOpacity={0.75}
    {...rest}
  >
    {loading ? (
      <ActivityIndicator
        size="small"
        color={variant === "primary" ? "#ffffff" : Colors.primary}
      />
    ) : (
      <Label variant={variant}>{label}</Label>
    )}
  </StyledButton>
);
