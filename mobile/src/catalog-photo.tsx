import { themedStyles } from './appearance';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { apiConfig } from './api/config';

export function CatalogPhoto({ id, style }: { id?: string; style: StyleProp<ViewStyle> }) {
  const s = useStyles();
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

const useStyles = themedStyles((colors) =>
  StyleSheet.create({
    frame: { backgroundColor: colors.mint, overflow: 'hidden', borderRadius: 12 },
  }),
);
