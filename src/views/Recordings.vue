<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title> {{ $t("Recordings") }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="settings"> {{ $t("Settings") }} </v-tab>
          <v-tab key="view"> {{ $t("View Recordings") }} </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item key="settings" class="bg">
        <v-card flat class="ma-0" color="bg">
          <v-form>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    class="py-0 my-0"
                    v-model="recordingall"
                    :label="$t('Record all users')"
                  ></v-checkbox>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="details.recordingretentiondays"
                    :rules="numberRules"
                    class="shrink>"
                    required
                    :label="$t('Retention days')"
                  >
                  </v-text-field>
                </v-col>
              </v-row>
            </v-container>
            <v-btn color="primary" class="ma-4" @click="saveSettings"
              >Save
            </v-btn>
          </v-form>
        </v-card>
      </v-tab-item>
      <v-tab-item key="view" class="bg">
        <v-card>
          <v-card-title> </v-card-title>
          <v-data-table
            :headers="headers"
            :items="rows"
            :loading="loading"
            :search="search"
            :options.sync="options"
            @update:options="updateOptions"
            multi-sort
            class="ma-4 bg"
          >
            <template v-slot:item.start_time="{ item }">
              {{ moment(item.start_time).format("LLL") }}
            </template>

            <template v-slot:item.end_time="{ item }">
              {{ moment(item.end_time).format("LLL") }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon small @click="prepare(item, $event)" class="mx-2">
                mdi-play
              </v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    <v-dialog v-model="playDialog" max-width="660" overlay-color="primary">
      <!--   height="680"  persistent  width="640" height="480" -->
      <v-card color="primary">
        <!--<v-toolbar
          dark
          color="primary"
        >
          <v-btn
            icon
            dark
            @click="playDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title> {{ $t("Play Recording") }}</v-toolbar-title>
          </v-toolbar> -->
        <v-container>
          <!--<Artplayer @get-instance="getInstance" :option="playerOption" :style="playerStyle" /> -->
          <div id="artplayer-app">&nbsp;</div>
        </v-container>
      </v-card>
    </v-dialog>
    <v-dialog v-model="prepDialog" hide-overlay persistent width="300">
      <v-card color="primary" dark>
        <v-card-text>
          Preparing recording video
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackbarSave = false"
        >
          {{ $t("Close") }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>
<style>
#artplayer-app {
  width: 640px;
  height: 480px;
  margin: "0 auto 0";
}
</style>

 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
//import Artplayer from "artplayer/examples/vue/Artplayer";
import Artplayer from "artplayer";
const moment = require("moment");

let page = {
  name: "Recordings",
  data: () => ({
    tab: {},
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    details: {},
    numberRules: [],
    snackbarSave: false,
    snackbarText: "",
    recordingall: false,
    prepDialog: false,
    playDialog: false,
    playItem: {},
    playerOption: {
      url: "https://artplayer.org/assets/sample/video.mp4",
    },
    playerStyle: {
      width: "640px",
      height: "480px",
      margin: "0 auto 0",
    },
    moment,
    appData,
  }),
  /*components: {
    Artplayer,
  },*/
  methods: {
    getInstance(art) {
      console.log(art);
    },
    savePage: function () {
      //console.log(`options: ${JSON.stringify(this.options,null,2)}`);
      appUtils.savePageData(`${page.name}`, this, ["options", "search", "tab"]);
    },
    saveSettings: function () {
      console.log(this.details);
      if (!this.recordingall) {
        this.details.recordingall = "0";
      } else {
        this.details.recordingall = "1";
      }
      appUtils
        .post({
          url: "api/orgs/" + encodeURIComponent(appData.mainDomain),
          data: this.details,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Saved");
            this.snackbarSave = true;
            this.loadSettings();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarSave = true;
            this.snackbarText = this.$t("Error");
          }
        })
        .catch((error) => console.log(error));
    },
    loadSettings: function () {
      console.log(`loadSettings: ${appData.mainDomain}`);
      appUtils
        .get({
          url: "api/orgs/" + encodeURIComponent(appData.mainDomain),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            if (response.data.orgs && response.data.orgs.length == 1) {
              this.details = response.data.orgs[0];
              this.recordingall = this.details.recordingall ? true : false;
            } else {
              this.details = {};
            }
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    loadRecordings: function () {
      this.headers = [
        { text: this.$t("Start"), value: "start_time" },
        { text: this.$t("End"), value: "end_time" },
        { text: this.$t("Seconds"), value: "active_seconds" },
        { text: this.$t("Email"), value: "session_history.email" },
        { text: this.$t("Device ID"), value: "session_history.device_id" },
        { text: this.$t("Device Name"), value: "session_history.devicename" },
        { text: "Actions", value: "actions", sortable: false },
      ];
      console.log(`loadRecordings: ${appData.mainDomain}`);
      appUtils
        .get({
          url: "api/recordings",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.rows = response.data.results;
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateOptions: function (newOptions) {
      console.log(`updateOptions: ${newOptions}`);
    },
    prepare: function (item) {
      console.log(`prepare: ${JSON.stringify(item, null, 2)}`);
      this.prepDialog = true;
      this.playItem = item;
      appUtils
        .post({
          url: `api/recordings/${item.session_id}/${item.start_time}`,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`File is ready!`);
            this.prepDialog = false;
            this.play();
          } else if (response.data.status == 2) {
            console.log(`Preparing file...`);
            let notifToken = response.data.notifToken;
            this.scheduleLongOperCheck(notifToken);
          } else {
            console.log(`status: ${response.data.status}`);
            this.prepDialog = false;
            this.snackbarSave = true;
            this.snackbarText = this.$t("Error");
          }
        })
        .catch((error) => {
          console.log(error);
          this.snackbarSave = true;
          this.snackbarText = this.$t("Error");
        });
    },
    scheduleLongOperCheck: function (notifToken) {
      console.log("scheduleLongOperCheck: " + notifToken);
      appUtils
        .get({
          url: "api/longOperations/" + notifToken,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 50 || response.data.status == 2) {
            setTimeout(this.scheduleLongOperCheck, 1000, notifToken);
          } else if (response.data.status == 1) {
            console.log("response.data.status == 1");
            this.prepDialog = false;
            this.play();
          } else {
            console.log("response.data.status != 1");
            this.prepDialog = false;
            this.snackbarSave = true;
            this.snackbarText = this.$t("Error");
          }
        })
        .catch((error) => {
          console.log(error);
          this.prepDialog = false;
          this.snackbarSave = true;
          this.snackbarText = this.$t("Error");
        });
    },
    play: function () {
      let url = `api/recordings/${this.playItem.session_id}/${this.playItem.start_time}?adminLoginToken=${appData.adminLoginToken}`;
      if (appData.postURL) {
        url = appData.postURL + url;
      }
      // if (appData.proxyURL) {
      //     url = appData.proxyURL + url;
      // }
      //this.playerOption.url = url;
      this.playDialog = true;
      if (this.art) {
          this.art.destroy();
          this.art = null;
      }
      setTimeout(() => {
        this.art = new Artplayer({
          container: "#artplayer-app",
          url,
          autoplay: true,
          autoSize: true,
          fullscreen: true,
          screenshot: true,
          layers: [
            {
              index: 1,
              name: "timestamp",
              disable: false,
              html: `<div id="vidts">${this.playItem.start_time}</div>`,
              style: {
                position: "absolute",
                top: "20px",
                right: "20px",
                opacity: ".9",
                backgroundColor: "#000000"
              },
              click: function () {
                console.info("You click on the component");
                this.art.layers.show = false;
              },
              mounted: function () {
                console.info("Component mount completion");
              },
            },
          ],
        });
        let startTimeSec = new Date(this.playItem.start_time).getTime() / 1000;
        this.art.on('video:timeupdate', () => {
            //console.log(`Time update: ${arg}`);
            //console.log(arg);
            console.info(this.art.currentTime);
            let str = moment(new Date((startTimeSec + this.art.currentTime) * 1000)).format("LL LTS") ;
            document.getElementById("vidts").textContent=`${str}`;

        });
        console.log(`url: ${url}`);
      }, 1000);
    },
  },
  created: function () {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        to: "/",
        disabled: false,
      },
      {
        text: this.$t("Recordings"),
        to: "/Recordings",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    /*
    this.headers = [
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
    ];*/
    this.numberRules = [
      (v) => !isNaN(v) || this.$t("Please enter a valid number"),
    ];
    appUtils.loadPageData(`${page.name}`, this);
    //this.refresh();
  },
  watch: {
    tab: function (newVal) {
      console.log(`tab: ${newVal}`);
      this.savePage();
      if (newVal == 0) {
        this.loadSettings();
      } else if (newVal == 1) {
        this.loadRecordings();
      }
    },
  },
};
export default page;
</script>