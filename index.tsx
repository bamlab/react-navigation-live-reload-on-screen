import React from "react";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import {
  NavigationContainer,
  NavigationState,
  NavigationContainerRef,
  NavigationContainerProps,
  Theme,
  LinkingOptions,
  DocumentTitleOptions,
} from "@react-navigation/native";
export const PERSISTENCE_KEY = "NAVIGATION_STATE";

// Taken from https://reactnavigation.org/docs/state-persistence
export const useLiveReloadOnScreen = (): {
  waitForLiveReload: boolean;
  props: Partial<NavigationContainerProps>;
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

// Taken directly from react-navigation definitions to type the HOC below
declare type NavigationContainerType<Params extends {}> = (
  props: NavigationContainerProps & {
    theme?: Theme | undefined;
    linking?: LinkingOptions<Params> | undefined;
    fallback?: React.ReactNode;
    documentTitle?: DocumentTitleOptions | undefined;
    onReady?: (() => void) | undefined;
  } & {
    ref?: React.Ref<NavigationContainerRef<Params>> | undefined;
  }
) => React.ReactElement;

export const enableLiveReloadOnScreen =
  (enable: boolean) =>
  <Params extends {} = {}>(
    NavigationContainerComponent: NavigationContainerType<Params>
  ) => {
    if (enable) {
      const LiveReloadNavigationContainer = (
        props: React.ComponentProps<NavigationContainerType<Params>>,
        ref: React.Ref<NavigationContainerRef<Params>> | undefined
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
        NavigationContainerRef<Params>,
        React.ComponentProps<NavigationContainerType<Params>>
      >(LiveReloadNavigationContainer);
    }

    return NavigationContainerComponent;
  };

export const clearNavigationState = (): Promise<void> =>
  AsyncStorage.removeItem(PERSISTENCE_KEY);
