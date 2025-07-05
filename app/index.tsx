import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tabs layout, specifically to the 'add' tab as the default
  return <Redirect href="/(tabs)/add" />;
}
