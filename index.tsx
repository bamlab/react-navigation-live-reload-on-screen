import React from "react";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import {
  NavigationContainer,
  NavigationState,
  NavigationContainerRef,
} from "@react-navigation/native";
export const PERSISTENCE_KEY = "NAVIGATION_STATE";

// Taken from https://reactnavigation.org/docs/state-persistence
export const useLiveReloadOnScreen = (): {
  waitForLiveReload: boolean;
  props: Partial<React.ComponentProps<typeof NavigationContainer>>;
} => {
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        /* $FlowFixMe[incompatible-type] $FlowFixMe This comment suppresses an
         * error found when upgrading Flow to v0.142.0 To view the error,
         * delete this comment and run Flow. */
        if (Platform.OS !== "web" && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  return {
    waitForLiveReload: !isReady,
    props: {
      initialState,
      onStateChange: (state: NavigationState | undefined) =>
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)),
    },
  };
};

export const enableLiveReloadOnScreen =
  (enable: boolean) =>
  (
    NavigationContainerComponent: typeof NavigationContainer
  ): typeof NavigationContainer => {
    if (enable) {
      const LiveReloadNavigationContainer = (
        props: React.ComponentProps<typeof NavigationContainer>,
        ref: React.Ref<NavigationContainerRef> | undefined
      ) => {
        const { waitForLiveReload, props: liveReloadProps } =
          useLiveReloadOnScreen();
        if (waitForLiveReload) return null;

        const onStateChange = (state: NavigationState | undefined) => {
          if (liveReloadProps.onStateChange)
            liveReloadProps.onStateChange(state);
          if (props.onStateChange) props.onStateChange(state);
        };

        return (
          <NavigationContainerComponent
            ref={ref}
            {...liveReloadProps}
            {...props}
            onStateChange={onStateChange}
          />
        );
      };

      return React.forwardRef<
        NavigationContainerRef,
        React.ComponentProps<typeof NavigationContainer>
      >(LiveReloadNavigationContainer);
    }

    return NavigationContainerComponent;
  };

export const clearNavigationState = (): Promise<void> =>
  AsyncStorage.removeItem(PERSISTENCE_KEY);
