import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

/**
 * Drives an overlay's enter and exit transition.
 *
 * Rendering `null` the moment `open` flips to false skips the exit animation
 * entirely, so the component stays mounted until the closing animation has
 * actually finished — `mounted` is what the caller should gate its render on.
 */
export function useOverlayAnimation(open: boolean, offset: number) {
  const [mounted, setMounted] = useState(open);
  const slide = useRef(new Animated.Value(offset)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) setMounted(true);

    const animation = Animated.parallel([
      Animated.timing(slide, {
        toValue: open ? 0 : offset,
        duration: open ? 280 : 220,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: open ? 1 : 0,
        duration: open ? 200 : 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });

    return () => animation.stop();
  }, [open, offset, slide, fade]);

  return { mounted, slide, fade };
}
