import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import { signMediaUrls } from '@/lib/media';
import { radius, spacing } from '@/lib/theme';

// Given stored object paths, fetch signed URLs and render a thumbnail row.
export function MediaStrip({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (paths.length) {
      signMediaUrls(paths).then((u) => active && setUrls(u));
    } else {
      setUrls([]);
    }
    return () => {
      active = false;
    };
  }, [paths.join(',')]);

  if (!urls.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {urls.map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.thumb} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, marginTop: spacing.sm },
  thumb: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: '#eee' },
});
