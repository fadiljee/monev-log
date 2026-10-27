import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface IconTileProps {
  icon: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export default function IconTile({
  icon,
  size = 36,
  backgroundColor = colors.actionTint,
  style,
}: IconTileProps) {
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size / 3),
          backgroundColor,
        },
        style,
      ]}
    >
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
