import React, { useEffect, useRef } from "react";
import {
  Modal,
  Animated,
  TouchableWithoutFeedback,
  View,
  Dimensions,
} from "react-native";
import styled from "styled-components/native";
import { Colors } from "../../constants/colors";

const { height: SCREEN_H } = Dimensions.get("window");

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
}

const Backdrop = styled(View)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: flex-end;
`;

const Sheet = styled(Animated.View)`
  background-color: ${Colors.surface};
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  padding-bottom: 36px;
`;

const Handle = styled(View)`
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background-color: ${Colors.borderMedium};
  align-self: center;
  margin-bottom: 16px;
`;

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeight = SCREEN_H * 0.7,
}) => {
  const translateY = useRef(new Animated.Value(maxHeight)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : maxHeight,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Backdrop>
          <TouchableWithoutFeedback>
            <Sheet style={{ transform: [{ translateY }], maxHeight }}>
              <Handle />
              {children}
            </Sheet>
          </TouchableWithoutFeedback>
        </Backdrop>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
