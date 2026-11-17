import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { APP_COLORS } from './theme';

type ScreenProps = PropsWithChildren<{
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}>;

const DEFAULT_EDGES: Edge[] = ['left', 'right', 'bottom'];

export function Screen({ children, edges = DEFAULT_EDGES, style }: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      style={StyleSheet.flatten([
        styles.container,
        { backgroundColor: APP_COLORS.background },
        style,
      ])}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
});
