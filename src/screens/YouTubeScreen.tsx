import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import YoutubePlayer from 'react-native-youtube-iframe';
import {usePlayer} from '../context/PlayerContext';
import {searchYouTube, getAudioStream} from '../api/youtube';

export default function YouTubeScreen() {
  const {playSong, currentSong, isPlaying} = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [streamedSongs, setStreamedSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await searchYouTube(query));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const playAudio = async (video: any) => {
    setLoading(true);
    try {
      const stream = await getAudioStream(video.id);
      if (stream) {
        const song = {id: `yt-${video.id}`, title: stream.title || video.title, artist: stream.author || video.channel, url: stream.url, cover: video.thumbnail, source: 'youtube'};
        setStreamedSongs(prev => [song, ...prev.filter(s => s.id !== song.id)]);
        await playSong([song, ...streamedSongs.filter((s: any) => s.id !== song.id)], 0);
      } else {
        Alert.alert('Error', 'Could not get audio stream');
      }
    } catch {
      Alert.alert('Error', 'Stream failed');
    } finally {
      setLoading(false);
    }
  };

  const data = [
    ...(results.length > 0 ? [{type: 'header', key: 'rh', title: 'Search Results'}] : []),
    ...results.map(r => ({type: 'result', key: r.id, ...r})),
    ...(streamedSongs.length > 0 ? [{type: 'header', key: 'sh', title: 'Recently Played'}] : []),
    ...streamedSongs.map(s => ({type: 'streamed', key: s.id, ...s})),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput style={styles.input} value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Search for music..." placeholderTextColor="#6a6a6a" returnKeyType="search" />
        <TouchableOpacity style={styles.searchBtn} onPress={search}>{searching ? <ActivityIndicator size="small" color="#000" /> : <Icon name="search" size={20} color="#000" />}</TouchableOpacity>
      </View>

      {loading && <View style={styles.loadingBar}><ActivityIndicator size="small" color="#1DB954" /><Text style={{color: '#1DB954', fontSize: 12, marginLeft: 8}}>Getting audio...</Text></View>}

      {playingVideoId && (
        <View style={{marginBottom: 16, borderRadius: 12, overflow: 'hidden'}}>
          <YoutubePlayer height={200} videoId={playingVideoId} play={true} />
          <TouchableOpacity style={styles.closePlayer} onPress={() => setPlayingVideoId(null)}><Icon name="close" size={20} color="#fff" /></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={item => item.key}
        contentContainerStyle={{paddingBottom: 140}}
        renderItem={({item}: any) => {
          if (item.type === 'header') return <Text style={styles.sectionTitle}>{item.title}</Text>;
          if (item.type === 'result') return (
            <View style={styles.resultItem}>
              <TouchableOpacity style={styles.thumb} onPress={() => setPlayingVideoId(playingVideoId === item.id ? null : item.id)}>
                <Image source={{uri: item.thumbnail}} style={styles.thumbImg} />
                <View style={styles.playOverlay}><Icon name={playingVideoId === item.id ? 'pause' : 'play'} size={20} color="#fff" /></View>
              </TouchableOpacity>
              <TouchableOpacity style={{flex: 1, marginHorizontal: 10}} onPress={() => playAudio(item)}>
                <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.resultMeta}>{item.channel} • {item.duration}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.playAudioBtn} onPress={() => playAudio(item)}><Icon name="play" size={16} color="#000" /></TouchableOpacity>
            </View>
          );
          if (item.type === 'streamed') {
            const active = currentSong?.url === item.url;
            const idx = streamedSongs.findIndex((s: any) => s.id === item.id);
            return (
              <TouchableOpacity style={[styles.songItem, active && {backgroundColor: '#282828'}]} onPress={() => playSong(streamedSongs, idx)}>
                <View style={styles.songArt}>{item.cover ? <Image source={{uri: item.cover}} style={{width: 40, height: 40, borderRadius: 4}} /> : <Icon name="musical-notes" size={18} color="#6a6a6a" />}</View>
                <View style={{flex: 1, marginLeft: 10}}>
                  <Text style={[{color: '#fff', fontSize: 13, fontWeight: '500'}, active && {color: '#1DB954'}]} numberOfLines={1}>{item.title}</Text>
                  <Text style={{color: '#b3b3b3', fontSize: 11}}>{item.artist}</Text>
                </View>
              </TouchableOpacity>
            );
          }
          return null;
        }}
        ListEmptyComponent={!searching ? <View style={styles.empty}><Icon name="search" size={60} color="#6a6a6a" /><Text style={styles.emptyTitle}>Search YouTube</Text><Text style={styles.emptyText}>Find and play music directly</Text></View> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212', padding: 16},
  searchRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  input: {flex: 1, backgroundColor: '#282828', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#333'},
  searchBtn: {backgroundColor: '#1DB954', borderRadius: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  loadingBar: {flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#282828', borderRadius: 8, marginBottom: 12},
  closePlayer: {position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
  sectionTitle: {color: '#fff', fontSize: 18, fontWeight: '600', marginVertical: 12},
  resultItem: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  thumb: {width: 56, height: 56, borderRadius: 6, overflow: 'hidden'},
  thumbImg: {width: 56, height: 56},
  playOverlay: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center'},
  resultTitle: {color: '#fff', fontSize: 13, fontWeight: '500'},
  resultMeta: {color: '#b3b3b3', fontSize: 11, marginTop: 2},
  playAudioBtn: {backgroundColor: '#1DB954', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
  songItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 6},
  songArt: {width: 40, height: 40, borderRadius: 4, backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyTitle: {color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12},
  emptyText: {color: '#b3b3b3', fontSize: 14, marginTop: 4},
});
