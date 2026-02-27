// This file is hidden in the tab layout.
// The Notes editor (notes/editor.tsx) handles note creation now.
import { Redirect } from 'expo-router';

export default function LegacyExplore() {
  return <Redirect href={'/notes' as any} />;
}
