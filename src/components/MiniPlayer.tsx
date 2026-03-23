import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {usePlayer} from '../context/PlayerContext';

export default function MiniPlayer() {
  const {currentSong, isPlaying, togglePlayPause, skipNext, setShowNowPlaying, showNowPlaying} = usePlayer();
  if (!currentSong || showNowPlaying) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={() => setShowNowPlaying(true)} activeOpacity={0.9}>
      <View style={styles.art}>
        {currentSong.cover ? <Image source={{uri: currentSong.cover}} style={styles.artImg} /> : <Icon name="musical-notes" size={20} color="#6a6a6a" />}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentSong.artist || 'Unknown'}</Text>
      </View>
      <TouchableOpacity onPress={togglePlayPause} style={styles.btn}>
        <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={skipNext} style={styles.btn}>
        <Icon name="play-skip-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {position: 'absolute', bottom: 56, left: 0, right: 0, backgroundColor: '#282828', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#333'},
  art: {width: 42, height: 42, borderRadius: 6, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  artImg: {width: 42, height: 42},
  info: {flex: 1, marginLeft: 10},
  title: {color: '#fff', fontSize: 13, fontWeight: '600'},
  artist: {color: '#b3b3b3', fontSize: 11},
  btn: {padding: 8},
});
