import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { apiConfig } from './api/config';
import { colors } from './theme';

export function CatalogPhoto({ id, style }: { id?: string; style: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.frame, style]}>
      {id && (
        <Image
          source={{
            uri: `${apiConfig.baseUrl.replace(/\/$/, '')}/files/${encodeURIComponent(id)}/download`,
          }}
          contentFit="cover"
          recyclingKey={id}
          cachePolicy="none"
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  frame: { backgroundColor: colors.mint, overflow: 'hidden', borderRadius: 12 },
});
