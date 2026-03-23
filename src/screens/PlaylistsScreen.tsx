import React, {useState} from 'react';
import {View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput, Modal, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {usePlayer} from '../context/PlayerContext';

export default function PlaylistsScreen() {
  const {playlists, createPlaylist, deletePlaylist, playSong, currentSong, isPlaying, addToPlaylist, removeFromPlaylist, library} = usePlayer();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddSongs, setShowAddSongs] = useState(false);

  const handleCreate = () => {
    if (newName.trim()) { createPlaylist(newName.trim()); setNewName(''); setShowCreate(false); }
  };

  const playlist = selectedId ? playlists.find((p: any) => p.id === selectedId) : null;

  if (playlist) {
    const isSongAdded = (url: string) => playlist.songs.some((s: any) => s.url === url);
    return (
      <View style={s.container}>
        <View style={s.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedId(null)}><Icon name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <View style={{flex: 1, marginLeft: 12}}>
            <Text style={s.detailTitle}>{playlist.name}</Text>
            <Text style={{color: '#b3b3b3', fontSize: 12}}>{playlist.songs.length} songs</Text>
          </View>
          <TouchableOpacity style={s.addSongsBtn} onPress={() => setShowAddSongs(true)}><Icon name="add" size={18} color="#fff" /><Text style={{color: '#fff', fontSize: 12, marginLeft: 4}}>Add</Text></TouchableOpacity>
          {playlist.songs.length > 0 && <TouchableOpacity style={s.playAllBtn} onPress={() => playSong(playlist.songs, 0)}><Icon name="play" size={18} color="#000" /></TouchableOpacity>}
        </View>
        {playlist.songs.length === 0 ? (
          <View style={s.empty}><Icon name="musical-notes" size={50} color="#6a6a6a" /><Text style={s.emptyTitle}>Empty playlist</Text></View>
        ) : (
          <FlatList data={playlist.songs} keyExtractor={(_: any, i: number) => String(i)} contentContainerStyle={{paddingBottom: 140}} renderItem={({item, index}: any) => {
            const active = currentSong?.url === item.url;
            return (
              <TouchableOpacity style={[s.songItem, active && {backgroundColor: '#282828'}]} onPress={() => playSong(playlist.songs, index)}>
                <Text style={[s.songNum, active && {color: '#1DB954'}]}>{active && isPlaying ? '▶' : index + 1}</Text>
                <View style={s.songArt}>{item.cover ? <Image source={{uri: item.cover}} style={{width: 40, height: 40, borderRadius: 4}} /> : <Icon name="musical-notes" size={18} color="#6a6a6a" />}</View>
                <View style={{flex: 1}}><Text style={[s.songTitle, active && {color: '#1DB954'}]} numberOfLines={1}>{item.title}</Text><Text style={s.songArtist}>{item.artist}</Text></View>
                <TouchableOpacity onPress={() => removeFromPlaylist(playlist.id, item.url)}><Icon name="trash-outline" size={18} color="#6a6a6a" /></TouchableOpacity>
              </TouchableOpacity>
            );
          }} />
        )}
        <Modal visible={showAddSongs} animationType="slide" transparent>
          <View style={s.modalOverlay}><View style={s.modal}>
            <Text style={s.modalTitle}>Add Songs</Text>
            {library.length === 0 ? <Text style={{color: '#b3b3b3', textAlign: 'center', padding: 20}}>Play songs first to build your library!</Text> : (
              <FlatList data={library} keyExtractor={(item: any) => item.id} style={{maxHeight: 400}} renderItem={({item}: any) => {
                const added = isSongAdded(item.url);
                return (
                  <TouchableOpacity style={s.addSongItem} onPress={() => added ? removeFromPlaylist(playlist.id, item.url) : addToPlaylist(playlist.id, item)}>
                    <View style={{flex: 1}}><Text style={{color: '#fff', fontSize: 13}} numberOfLines={1}>{item.title}</Text><Text style={{color: '#b3b3b3', fontSize: 11}}>{item.artist}</Text></View>
                    <View style={[s.checkCircle, added && s.checkActive]}><Icon name={added ? 'checkmark' : 'add'} size={16} color={added ? '#000' : '#b3b3b3'} /></View>
                  </TouchableOpacity>
                );
              }} />
            )}
            <TouchableOpacity style={s.doneBtn} onPress={() => setShowAddSongs(false)}><Text style={{color: '#000', fontWeight: '600'}}>Done</Text></TouchableOpacity>
          </View></View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)}><Icon name="add" size={20} color="#000" /><Text style={{color: '#000', fontWeight: '600', marginLeft: 4}}>New Playlist</Text></TouchableOpacity>
      {playlists.length === 0 ? (
        <View style={s.empty}><Icon name="list" size={60} color="#6a6a6a" /><Text style={s.emptyTitle}>No playlists yet</Text></View>
      ) : (
        <FlatList data={playlists} keyExtractor={(item: any) => String(item.id)} numColumns={2} columnWrapperStyle={{gap: 12}} contentContainerStyle={{gap: 12, paddingBottom: 140}} renderItem={({item}: any) => (
          <TouchableOpacity style={s.card} onPress={() => setSelectedId(item.id)} onLongPress={() => Alert.alert('Delete?', `Delete "${item.name}"?`, [{text: 'Cancel'}, {text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(item.id)}])}>
            <View style={s.cardArt}>{item.songs[0]?.cover ? <Image source={{uri: item.songs[0].cover}} style={{width: '100%', height: '100%'}} /> : <Icon name="musical-notes" size={40} color="#6a6a6a" />}</View>
            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={{color: '#b3b3b3', fontSize: 12}}>{item.songs.length} songs</Text>
          </TouchableOpacity>
        )} />
      )}
      <Modal visible={showCreate} transparent animationType="fade">
        <View style={s.modalOverlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Create Playlist</Text>
          <TextInput style={s.modalInput} placeholder="Playlist name" placeholderTextColor="#6a6a6a" value={newName} onChangeText={setNewName} onSubmitEditing={handleCreate} autoFocus />
          <View style={{flexDirection: 'row', gap: 10, justifyContent: 'flex-end'}}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={{color: '#fff'}}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.doneBtn} onPress={handleCreate}><Text style={{color: '#000', fontWeight: '600'}}>Create</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212', padding: 16},
  createBtn: {backgroundColor: '#1DB954', borderRadius: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyTitle: {color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12},
  card: {flex: 1, backgroundColor: '#181818', borderRadius: 8, padding: 12},
  cardArt: {width: '100%', aspectRatio: 1, borderRadius: 6, backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden'},
  cardName: {color: '#fff', fontSize: 14, fontWeight: '600'},
  detailHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  detailTitle: {color: '#fff', fontSize: 22, fontWeight: '700'},
  addSongsBtn: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#555', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8},
  playAllBtn: {backgroundColor: '#1DB954', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  songItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10},
  songNum: {width: 28, textAlign: 'center', color: '#b3b3b3', fontSize: 13},
  songArt: {width: 40, height: 40, borderRadius: 4, backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  songTitle: {color: '#fff', fontSize: 13, fontWeight: '500'},
  songArtist: {color: '#b3b3b3', fontSize: 11},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'},
  modal: {backgroundColor: '#282828', borderRadius: 12, padding: 20, width: '85%'},
  modalTitle: {color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16},
  modalInput: {backgroundColor: '#121212', borderRadius: 6, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#333', marginBottom: 16},
  cancelBtn: {borderWidth: 1, borderColor: '#555', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10},
  doneBtn: {backgroundColor: '#1DB954', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12, alignItems: 'center'},
  addSongItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10},
  checkCircle: {width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#555', alignItems: 'center', justifyContent: 'center'},
  checkActive: {backgroundColor: '#1DB954', borderColor: '#1DB954'},
});
