import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

interface State {
  hasError: boolean;
  error: Error | null;
}

const Container = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 32px;
`;

const EmojiText = styled(Text)`
  font-size: 48px;
  margin-bottom: 16px;
`;

const Title = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin-bottom: 8px;
`;

const ErrorText = styled(Text)`
  font-size: 13px;
  color: ${Colors.textMuted};
  text-align: center;
  margin-bottom: 24px;
`;

const RetryBtn = styled(TouchableOpacity)`
  padding: 12px 24px;
  background-color: ${Colors.primary};
  border-radius: 12px;
`;

const RetryText = styled(Text)`
  color: #fff;
  font-weight: 600;
`;

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <EmojiText>⚠️</EmojiText>
          <Title>Something went wrong</Title>
          <ErrorText>{this.state.error?.message}</ErrorText>
          <RetryBtn onPress={this.reset} activeOpacity={0.75}>
            <RetryText>Try again</RetryText>
          </RetryBtn>
        </Container>
      );
    }
    return this.props.children;
  }
}
