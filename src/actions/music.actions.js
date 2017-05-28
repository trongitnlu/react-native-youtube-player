import * as types from './types';
import Config from '../config';
import RNFetchBlob from 'react-native-fetch-blob';
import * as Utils from '../helpers/utils';
import {AsyncStorage} from 'react-native';
import RNFS from 'react-native-fs';

export function downloadMusic(song, changedPath) {
    console.log('downloadMusic', song, changedPath);
    return async (dispatch) => {
      song.downloading = true;
      let songs = await Utils.getSongsFromStorage();
      if(Utils.findSongInCollection(song.id, songs)) return {};
      let dirs = RNFetchBlob.fs.dirs;
      let songInfo = {url: song.path}
      if(!changedPath) songInfo = await Utils.getSongInfo(song.path);
      console.log(songInfo.url);
      const songRes = await RNFetchBlob
                      .config({
                        path: `${dirs.DocumentDir}/${song.id}.mp3`
                      })
                      .fetch('GET', songInfo.url, {})
                      .progress((received, total) => {
                        dispatch(setProgress(received / total, song.id));
                      });
        const imgRes = await RNFetchBlob
                        .config({
                          path: `${dirs.DocumentDir}/${song.id}.jpg`
                        })
                        .fetch('GET', song.thumb, {});
        song.downloading = false;
        song.downloaded = true;
        song.path = songRes.path();
        song.thumb = imgRes.path();
        songs = JSON.stringify([...songs, song]);
        await AsyncStorage.setItem('songs', songs);
        return dispatch(setSongs(JSON.parse(songs)));
    }
}

export function musicDownloaded(path) {
  return {
    type: types.DOWNLOADED,
    path
  }
}

export function getSongs() {
    return async (dispatch) => {
      let songs = await Utils.getSongsFromStorage();
      return dispatch(setSongs(songs));
    }
}

export function deleteSong(index, song) {
  return async (dispatch) => {
    let songs = await Utils.getSongsFromStorage();
    try {
      await RNFS.unlink(song.path);
      await RNFS.unlink(song.thumb);
      songs.splice(index, 1);
      await AsyncStorage.setItem('songs', JSON.stringify(songs));
      return dispatch(setSongs(songs));
    } catch(err) {
        //If song not fount in path
        songs.splice(index, 1);
        await AsyncStorage.setItem('songs', JSON.stringify(songs));
        return dispatch(setSongs(songs));
    }
  }
}

export function setSongs(songs) {
  return {
    type: types.SONGS,
    songs
  }
}

export function setProgress(progress, id) {
  return {
    type: types.PROGRESS,
    progress,
    id
  }
}
