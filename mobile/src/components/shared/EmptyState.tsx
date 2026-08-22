import React from "react";
import { View, Text } from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

interface Props {
  emoji?: string;
  title: string;
  description?: string;
}

const Container = styled(View)`
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
`;

const EmojiText = styled(Text)`
  font-size: 48px;
  margin-bottom: 16px;
`;

const Title = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: ${Colors.textPrimary};
  text-align: center;
  margin-bottom: 8px;
`;

const Description = styled(Text)`
  font-size: 14px;
  color: ${Colors.textMuted};
  text-align: center;
  line-height: 21px;
`;

export const EmptyState: React.FC<Props> = ({ emoji, title, description }) => (
  <Container>
    <Title>{title}</Title>
    {description && <Description>{description}</Description>}
  </Container>
);
