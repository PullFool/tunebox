import React, {useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, FlatList, StyleSheet, Alert} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {usePlayer} from '../context/PlayerContext';

export default function MyMusicScreen() {
  const {playSong, currentSong, isPlaying, playlists, addToPlaylist} = usePlayer();
  const [localSongs, setLocalSongs] = useState<any[]>([]);

  const pickFiles = useCallback(async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      });
      const newSongs = results.map(file => ({
        id: `local-${Date.now()}-${Math.random()}`,
        title: file.name?.replace(/\.[^/.]+$/, '') || 'Unknown',
        artist: 'Local File',
        url: file.fileCopyUri || file.uri,
        cover: null,
        source: 'local',
      }));
      setLocalSongs(prev => [...prev, ...newSongs]);
    } catch (e: any) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert('Error', 'Failed to pick files');
      }
    }
  }, []);

  const showPlaylistPicker = (song: any) => {
    if (playlists.length === 0) {
      Alert.alert('No Playlists', 'Create a playlist first');
      return;
    }
    const buttons = playlists.map((p: any) => ({text: p.name, onPress: () => addToPlaylist(p.id, song)}));
    buttons.push({text: 'Cancel', style: 'cancel' as const});
    Alert.alert('Add to Playlist', 'Choose a playlist', buttons);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadArea} onPress={pickFiles}>
        <Icon name="cloud-upload" size={40} color="#6a6a6a" />
        <Text style={styles.uploadText}>Tap to add music files</Text>
        <Text style={styles.uploadHint}>MP3, M4A, WAV, OGG, FLAC</Text>
      </TouchableOpacity>

      {localSongs.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="musical-notes" size={60} color="#6a6a6a" />
          <Text style={styles.emptyTitle}>No music yet</Text>
          <Text style={styles.emptyText}>Add files or stream from YouTube</Text>
        </View>
      ) : (
        <FlatList
          data={localSongs}
          keyExtractor={item => item.id}
          contentContainerStyle={{paddingBottom: 140}}
          renderItem={({item, index}) => {
            const active = currentSong?.url === item.url;
            return (
              <TouchableOpacity style={[styles.songItem, active && {backgroundColor: '#282828'}]} onPress={() => playSong(localSongs, index)}>
                <Text style={[styles.songNum, active && {color: '#1DB954'}]}>{active && isPlaying ? '▶' : index + 1}</Text>
                <View style={styles.songArt}><Icon name="musical-notes" size={18} color="#6a6a6a" /></View>
                <View style={{flex: 1}}>
                  <Text style={[styles.songTitle, active && {color: '#1DB954'}]} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => showPlaylistPicker(item)} style={{padding: 8}}>
                  <Icon name="add" size={22} color="#b3b3b3" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212', padding: 16},
  uploadArea: {borderWidth: 2, borderColor: '#333', borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center', marginBottom: 20},
  uploadText: {color: '#b3b3b3', fontSize: 14, marginTop: 8},
  uploadHint: {color: '#6a6a6a', fontSize: 12, marginTop: 4},
  empty: {alignItems: 'center', paddingTop: 40},
  emptyTitle: {color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12},
  emptyText: {color: '#b3b3b3', fontSize: 14, marginTop: 4},
  songItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 6},
  songNum: {width: 28, textAlign: 'center', color: '#b3b3b3', fontSize: 13},
  songArt: {width: 40, height: 40, borderRadius: 4, backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center', marginRight: 10},
  songTitle: {color: '#fff', fontSize: 14, fontWeight: '500'},
  songArtist: {color: '#b3b3b3', fontSize: 12},
});
