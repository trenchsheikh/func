import { ImageSourcePropType } from 'react-native';

// Photo drop-in point (Decision 005). To use real photos later, add files here and map
// them by user id, e.g.:  'u-maya': require('./maya.jpg'),
// Avatars automatically switch from gradient monograms to photos where an entry exists.
export const photos: Record<string, ImageSourcePropType> = {};
