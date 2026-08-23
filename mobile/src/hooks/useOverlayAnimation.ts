import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

/**
 * Drives an overlay's enter and exit transition.
 *
 * Two things have to be true for the transition to be visible:
 *
 *  - The view must still be mounted while it animates out, so rendering `null`
 *    the moment `open` flips to false is wrong; `mounted` stays true until the
 *    closing animation finishes.
 *  - The view must already be mounted before it animates in. Starting the
 *    animation in the same effect that mounts it means the value advances while
 *    nothing is on screen, so the overlay appears already part-way open. The
 *    mount and the animation are therefore in separate effects.
 */
export function useOverlayAnimation(open: boolean, offset: number) {
  const [mounted, setMounted] = useState(open);
  const slide = useRef(new Animated.Value(open ? 0 : offset)).current;
  const fade = useRef(new Animated.Value(open ? 1 : 0)).current;

  // Mount first. The view has to exist before it can be animated into place.
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Then animate — this only runs once the view is actually on screen.
  useEffect(() => {
    if (!mounted) return;

    const animation = Animated.parallel([
      Animated.timing(slide, {
        toValue: open ? 0 : offset,
        duration: open ? 300 : 220,
        easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: open ? 1 : 0,
        duration: open ? 220 : 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });

    return () => animation.stop();
  }, [open, mounted, offset, slide, fade]);

  return { mounted, slide, fade };
}
