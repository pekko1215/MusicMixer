<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="12">
        <v-card>
          <v-card-title>{{$store.state.user.profile.displayName}}</v-card-title>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title>Mix Playlist
            <v-spacer></v-spacer>
            <v-text-field
              v-model="playListSearch"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-data-table
            v-model="playListSelected"
            :headers="playListHeaders"
            :items="playList"
            item-key="id"
            :items-per-page="10"
            show-select
            @item-selected="playListSelectEvent"
            @toggle-select-all="playListAllSelectEvent"
            :search="playListSearch"
          >
            <template v-slot:item.image="{ item }">
              <v-avatar tile>
                <img :src="item.image" />
              </v-avatar>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title>
            Mixed Musics
            <v-spacer></v-spacer>
            <v-text-field
              v-model="musicListSearch"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-data-table
            v-model="musicListSelected"
            :headers="musicListHeaders"
            :items="musicList"
            item-key="id"
            :items-per-page="10"
            show-select
            :search="musicListSearch"
          >
            <template v-slot:item.playLists="{ item }">
              <v-chip v-for="v of item.playLists" :key="v.id">{{v.name}}</v-chip>
            </template>
            <template v-slot:item.album="{item}">
              <v-list-item>
                <v-list-item-avatar tile>
                  <img :src="item.album.image" />
                </v-list-item-avatar>
                <v-list-item-content>{{item.album.name}}</v-list-item-content>
              </v-list-item>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title>Parameters</v-card-title>
          <v-card-text>
            <v-text-field v-model.number="minutes" label="TargetTime(Min)" />
            <v-checkbox v-model="isReplacePlayList" label="Replace with the last created playlist"></v-checkbox>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="letsMix">Let's Mix!</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title>Result</v-card-title>
          <v-card-text v-if="mixResult">
            <v-virtual-scroll :items="mixResult" :item-height="80" height="500">
              <template v-slot="{item}">
                <v-list-item>
                  <v-list-item-avatar tile>
                    <img :src="item.album.image" />
                  </v-list-item-avatar>
                  <v-list-item-content class="text-outline">
                    <v-list-item-title>{{item.name}}</v-list-item-title>
                    <v-list-item-subtitle>{{item.artists.join(',')}}</v-list-item-subtitle>
                    {{item.length}}
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-virtual-scroll>
            Total Playing Time : {{totalPlayTime}}
          </v-card-text>
          <v-card-actions>
            <v-btn
              @click="openPlayListBySpotify"
              color="green"
              :disabled="!mixResult"
            >Open Playlist by Spotify</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="12">
        <v-btn href="/api/auth/logout">Sign out</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      playList: [],
      playListSelected: [],
      playListSearch:"",
      playListHeaders: [
        {
          text: "Image",
          value: "image",
          filterable: false
        },
        {
          text: "PlayListName",
          aligh: "start",
          value: "name",
        },
      ],
      musicList: [],
      musicListSelected: [],
      musicListSearch:"",
      musicListHeaders: [
        {
          text: "MusicName",
          value: "name",
        },
        {
          text: "Artist",
          value: "artists",
        },
        {
          text: "Album",
          value: "album",
        },
        {
          text: "PlayLists",
          value: "playLists",
        },
        {
          text: "Length",
          value: "length",
          filterable: false
        },
      ],
      minutes: 60,
      mixResult: null,
      totalPlayTime: 0,
      isReplacePlayList: true,
    };
  },
  fetch({ store, redirect }) {
    if (!store.state.auth) {
      return redirect("/");
    }
  },
  mounted() {
  },
  methods: {
    async playListAllSelectEvent({ items, value }) {
      items.forEach((item) => this.playListSelectEvent({ item, value }));
    },
    async playListSelectEvent({ item, value }) {
      if (value) {
        // プレイリスト選択追加時
        let { tracks } = await this.$store.dispatch("callAPI", {
          url: item.href,
        });
        let { items } = tracks;
        this.musicList.push(
          ...items
            .map(({ track }) => {
              let registed = null;
              if ((registed = this.musicList.find((t) => t.id === track.id))) {
                if (!registed.playLists.find((i) => i.id === item.id)) {
                  registed.playLists.push(item);
                }
                return null;
              }
              let { duration_ms } = track;
              let obj = {
                name: track.name,
                id: track.id,
                album: {
                  name: track.album.name,
                  id: track.album.id,
                  image: track.album.images[0].url,
                },
                uri: track.uri,
                duration_ms: track.duration_ms,
                length: this.msToString(duration_ms),
                playLists: [item],
                artists: track.artists.map((artist) => artist.name),
              };
              this.musicListSelected.push(obj);
              return obj;
            })
            .filter(Boolean)
            .filter(
              (x, i, self) => self.findIndex(({ id }) => id === x.id) === i
            )
        );
      } else {
        this.musicList = this.musicList.filter((music, i) => {
          music.playLists = music.playLists.filter((p) => p.id !== item.id);
          if (music.playLists.length === 0) {
            return false;
          }
          return true;
        });
      }
    },
    async letsMix() {
      let mixTable = [...this.musicListSelected];
      let time = this.minutes * 1000 * 60;
      let list = [];
      let prev = null;
      let totalTime = 0;
      while (time > 1000 * 60) {
        mixTable = mixTable.filter((m) => {
          return m.duration_ms < time && prev !== m;
        });
        if (mixTable.length === 0) break;
        let idx = Math.floor(Math.random() * mixTable.length);
        let music = mixTable[idx];
        mixTable.splice(idx, 1);
        if(mixTable.length == 0) mixTable = [...this.musicListSelected];
        list.push(music);
        prev = music;
        totalTime += music.duration_ms;
        time -= music.duration_ms;
      }
      const shuffle = ([...array]) => {
        for (let i = array.length - 1; i >= 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };
      this.mixResult = shuffle(list);
      this.totalPlayTime = this.msToString(totalTime);
    },
    msToString(ms) {
      let s = Math.floor(ms / 1000);
      let m = Math.floor(s / 60);
      s = s % 60;
      return `${m}:${("00" + s).slice(-2)}`;
    },
    async findOrCreatePlayList(isReplace) {
      let href = localStorage.getItem("lastPlayList");
      let playList = null;
      if (isReplace && href) {
        try {
          playList = await this.$store.dispatch("callAPI", {
            url: href,
          });
          return playList;
        } catch (e) {}
      }
      if (!playList) {
        playList = await this.$store.dispatch("callAPI", {
          url: "/me/playlists",
          params: {
            name: `${this.minutes}min PlayList`,
            description: `Create at ${new Date().toISOString()}`,
          },
          method: "POST",
        });
      }
      return playList;
    },
    async openPlayListBySpotify() {
      let playList = await this.findOrCreatePlayList(this.isReplacePlayList);
      let { href, tracks } = playList;
      await this.$store.dispatch("callAPI", {
        url: tracks.href,
        params: { uris: this.mixResult.map((m) => m.uri) },
        method: "PUT",
      });
      localStorage.setItem("lastPlayList", href);
      window.open(playList.external_urls.spotify);
    },
  },
  async asyncData({ params, store }) {
    let playList = [];
    let offset = 0;
    while (true) {
      let data = await store.dispatch("callAPI", {
        url: `/me/playlists?offset=${offset}`,
      });
      playList.push(
        ...data.items.map((item) => {
          return {
            id: item.id,
            image: item.images[0]?.url,
            name: item.name,
            href: item.href,
          };
        })
      );
      if (!data.next) break;
      offset += 20;
    }
    return { playList };
  },
};
</script>