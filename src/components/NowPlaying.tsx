import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet, Dimensions} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import {usePlayer} from '../context/PlayerContext';

const {width} = Dimensions.get('window');

export default function NowPlaying() {
  const {currentSong, isPlaying, currentTime, duration, shuffle, repeat, togglePlayPause, skipNext, skipPrev, seekTo, toggleShuffle, toggleRepeat, showNowPlaying, setShowNowPlaying} = usePlayer();
  if (!showNowPlaying || !currentSong) return null;

  const fmt = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowNowPlaying(false)}>
          <Icon name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.label}>NOW PLAYING</Text>
        <View style={{width: 28}} />
      </View>
      <View style={styles.artWrap}>
        {currentSong.cover ? <Image source={{uri: currentSong.cover}} style={styles.art} /> : <View style={[styles.art, styles.artPlaceholder]}><Icon name="musical-notes" size={80} color="#6a6a6a" /></View>}
      </View>
      <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{currentSong.artist || 'Unknown'}</Text>
      <View style={styles.seekWrap}>
        <Slider style={{width: width - 60}} minimumValue={0} maximumValue={duration || 1} value={currentTime} onSlidingComplete={seekTo} minimumTrackTintColor="#1DB954" maximumTrackTintColor="#555" thumbTintColor="#fff" />
        <View style={styles.times}>
          <Text style={styles.time}>{fmt(currentTime)}</Text>
          <Text style={styles.time}>{fmt(duration)}</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleShuffle}><Icon name="shuffle" size={24} color={shuffle ? '#1DB954' : '#b3b3b3'} /></TouchableOpacity>
        <TouchableOpacity onPress={skipPrev}><Icon name="play-skip-back" size={30} color="#fff" /></TouchableOpacity>
        <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}><Icon name={isPlaying ? 'pause' : 'play'} size={30} color="#000" /></TouchableOpacity>
        <TouchableOpacity onPress={skipNext}><Icon name="play-skip-forward" size={30} color="#fff" /></TouchableOpacity>
        <TouchableOpacity onPress={toggleRepeat}><Icon name="repeat" size={24} color={repeat > 0 ? '#1DB954' : '#b3b3b3'} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#121212', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 40},
  label: {color: '#b3b3b3', fontSize: 11, letterSpacing: 1},
  artWrap: {marginBottom: 30},
  art: {width: width - 80, height: width - 80, borderRadius: 8},
  artPlaceholder: {backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center'},
  title: {color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', maxWidth: width - 60},
  artist: {color: '#b3b3b3', fontSize: 14, marginTop: 4, marginBottom: 20},
  seekWrap: {width: width - 40, alignItems: 'center'},
  times: {flexDirection: 'row', justifyContent: 'space-between', width: width - 60},
  time: {color: '#b3b3b3', fontSize: 11},
  controls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: width - 80, marginTop: 20},
  playBtn: {backgroundColor: '#1DB954', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center'},
});
