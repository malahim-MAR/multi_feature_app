// This file is hidden in the tab layout.
// The Notes tab (notes/index.tsx) is the new home screen.
import { Redirect } from 'expo-router';

export default function LegacyHome() {
  return <Redirect href="/(tabs)/notes" />;
}
