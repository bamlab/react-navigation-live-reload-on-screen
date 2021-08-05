# react-navigation-live-reload-on-screen

Based [on this](https://reactnavigation.org/docs/state-persistence), stay on current screen when you live reload.
This works by storing the navigation state in the async storage and getting it back when reloading.

## Install

```sh
yarn add @bam.tech/react-navigation-live-reload-on-screen
```

## Usage

```tsx
import { NavigationContainer as ReactNavigationContainer } from "@react-navigation/native";
import { enableLiveReloadOnScreen } from "@bam.tech/react-navigation-live-reload-on-screen";

const ENABLE_LIVE_RELOAD = __DEV__;
const NavigationContainer = enableLiveReloadOnScreen(ENABLE_LIVE_RELOAD)(
  ReactNavigationContainer
);

// Use NavigationContainer instead of the one from react-navigation
```

### Clearing navigation state

If you need to clear the persisted navigation state at some point:

```tsx
import { clearNavigationState } from "@bam.tech/react-navigation-live-reload-on-screen";

clearNavigationState();
```
