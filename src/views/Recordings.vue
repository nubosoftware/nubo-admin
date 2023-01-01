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
        <v-card flat class="ma-0" color="bg" v-if="!recordingall">
          <v-card-title>{{ $t("Profiles") }}</v-card-title>
          <v-data-table
            :headers="recProfilesHeaders"
            :items="recProfilesRows"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn color="primary" dark class="mb-2" @click="addProfile">
                  {{ $t("Add Profiles") }}
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-icon small @click="deleteProfile(item)" class="mx-2">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
          <v-dialog
            v-model="profilesDialog"
            max-width="800px"
            overlay-color="bg"
          >
            <v-card color="bg">
              <v-card-title>
                {{ $t("Add Profiles") }}
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="profileSearch"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                ></v-text-field>
              </v-card-title>
              <v-data-table
                v-model="profilesSelected"
                :headers="profilesHeaders"
                :items="profilesRows"
                :loading="profilesLoading"
                class="elevation-1 ma-4 bg"
                :server-items-length="profilesTotalItems"
                :items-per-page="5"
                :options.sync="profileOptions"
                :search="profileSearch"
                show-select
                multi-sort
                @update:options="updateProfileOptions"
                @click:row="profileRowClick"
              >
                <template v-slot:[`header.data-table-select`]> &nbsp; </template>
                <template v-slot:top>
                  <v-toolbar flat color="bg">
                    <v-btn
                      color="primary"
                      class="mb-2"
                      @click="addSelected"
                      v-bind:disabled="addSelectedDisabled"
                      v-bind:loading="addSelectedLoading"
                    >
                      {{ $t("Assign Selected Profiles") }}
                    </v-btn>
                  </v-toolbar>
                </template>
              </v-data-table>
            </v-card>
          </v-dialog>
        </v-card>
      </v-tab-item>
      <v-tab-item key="view" class="bg">
        <v-card flat class="ma-0" color="bg">
          <v-card-title>
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  :items="dateRanges"
                  :label="$t('Time Period')"
                  :value="selectedDateRange"
                  @change="dateRangeChanged"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-menu
                  v-if="customdDateRange"
                  v-model="fromMenu"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="fromDate"
                      label="From"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="fromDate"
                    @input="fromMenu = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-menu
                  v-if="customdDateRange"
                  v-model="toMenu"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="toDate"
                      label="To"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="toDate"
                    @input="toMenu = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>
          </v-card-title>
          <v-card-title>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="rows"
            :loading="loading"
            :server-items-length="totalItems"
            :search="search"
            :options.sync="options"
            @update:options="updateOptions"
            multi-sort
            class="ma-4 bg"
          >
            <template v-slot:[`item.start_time`]="{ item }">
              {{ moment(item.start_time).format("LLL") }}
            </template>

            <template v-slot:[`item.end_time`]="{ item }">
              {{ moment(item.end_time).format("LLL") }}
            </template>
            <template v-slot:[`item.actions`]="{ item }">
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
.player-icon {
  font-size: 20px;
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
    hasDateRange: false,
    dateRanges: [],
    selectedDateRange: "",
    customdDateRange: false,
    fromDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    fromMenu: false,
    toDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    toMenu: false,
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
    recProfilesHeaders: [],
    recProfilesRows: [],
    profilesDialog: false,
    profilesHeaders: [],
    profilesRows: [],
    profilesLoading: true,
    profilesSelected: [],
    profileOptions: {},
    profileSearch: "",
    profilesTotalItems: 0,
    allSelected: [],
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
      appUtils.savePageData(`${page.name}`, this, [
        "options",
        "search",
        "selectedDateRange",
        "fromDate",
        "toDate",
        "tab",
      ]);
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
      this.recProfilesHeaders = [
        {
          text: this.$t("Last Name"),
          value: "lastname",
        },
        { text: this.$t("First Name"), value: "firstname" },
        { text: this.$t("Email"), value: "email" },
        { text: "Actions", value: "actions", sortable: false },
      ];

      // load or settings
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

      // load profiles
      appUtils
        .get({
          url: "api/recordings/profiles",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.recProfilesRows = response.data.results;
          } else {
            console.log(
              `api/recordings/profiles status: ${response.data.status}`
            );
          }
        })
        .catch((error) => console.log(error));
    },
    deleteProfile: function (item) {
        console.log(`deleteProfile: ${item.email}`);
        let emails = [item.email];
        appUtils
        .delete({
          url: "api/recordings/profiles",
          data: {
              emails
          }
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`Deleted`);
            this.snackbarSave = true;
            this.snackbarText = this.$t("Deleted");            
            this.loadSettings();
          } else {
            console.log(`deleteProfile status: ${response.data.status}`);
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
    addProfile: function () {
      this.profilesHeaders = [
        {
          text: this.$t("Last Name"),
          value: "lastName",
        },
        { text: this.$t("First Name"), value: "firstName" },
        { text: this.$t("Email"), value: "email" },
      ];
      this.profilesDialog = true;
      this.addSelectedDisabled = true;
      this.allSelected = [];
      //this.refreshProfiles();
    },
    updateProfileOptions: function () {
      console.log("updateProfileOptions");
      this.savePage();
      this.refreshProfiles();
    },
    addSelected: function () {
        console.log("addSelected");
        let emails = [];
        for (const [key] of Object.entries(this.allSelected)) {
            emails.push(key);
        }
        appUtils
        .put({
          url: "api/recordings/profiles",
          data: {
              emails
          }
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`Added`);
            this.snackbarSave = true;
            this.snackbarText = this.$t("Added");
            this.profilesDialog = false;    
            this.loadSettings();
          } else {
            console.log(`addSelected status: ${response.data.status}`);
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
    refreshProfiles: function () {
      this.profilesLoading = true;
      let limit =
        this.profileOptions.itemsPerPage > 0
          ? this.profileOptions.itemsPerPage
          : 10000;
      let offset = (this.profileOptions.page - 1) * limit;
      appUtils
        .post({
          url: "api/profiles",
          data: {
            offset: offset,
            limit: limit,
            sortBy: this.profileOptions.sortBy,
            sortDesc: this.profileOptions.sortDesc,
            search: this.profileSearch,
          },
        })
        .then((response) => {
          this.profilesLoading = false;
          console.log(response.data);
          if (response.data.status == 1) {
            this.profilesRows = response.data.profiles;
            this.profilesTotalItems = response.data.totalItems;
            let newSelected = [];
            this.profilesRows.forEach((element) => {
              if (this.allSelected[element.email]) {
                newSelected.push(element);
              }
            });
            this.profilesSelected = newSelected;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    applyDateRange: function (val) {
      let item;
      for (const checkitem of this.dateRanges) {
        if (checkitem.value == val) {
          item = checkitem;
          break;
        }
      }
      if (!item) {
        console.error(`Error date range not found for value: ${val}`);
        return;
      }
      if (item.dvalue) {
        this.fromDate = item.dvalue.from;
        this.toDate = item.dvalue.to;
        this.customdDateRange = false;
      } else {
        this.customdDateRange = true;
      }
      this.selectedDateRange = val;
      console.log(
        `applyDateRange. from ${this.fromDate}, to: ${this.toDate}, val: ${val}, selectedDateRange: ${this.selectedDateRange}`
      );
    },
    dateRangeChanged: function (val) {
      this.applyDateRange(val);
      this.loadRecordings();
    },
    dateChanged: function () {
      if (this.customdDateRange) {
        this.loadRecordings();
      }
    },
    loadRecordings: function () {
      this.headers = [
        { text: this.$t("Start"), value: "start_time" },
        { text: this.$t("End"), value: "end_time" },
        { text: this.$t("Seconds"), value: "active_seconds" },
        { text: this.$t("Email"), value: "session_history.email" },
        {
          text: this.$t("First Name"),
          value: "session_history.user.firstname",
          sortable: false,
        },
        {
          text: this.$t("Last Name"),
          value: "session_history.user.lastname",
          sortable: false,
        },
        { text: this.$t("Device ID"), value: "session_history.device_id" },
        { text: this.$t("Device Name"), value: "session_history.devicename" },
        { text: "Actions", value: "actions", sortable: false },
      ];
      let nowDate = moment().format("YYYY-MM-DD");
      this.dateRanges = [
        {
          value: "this_day",
          text: "Today",
          dvalue: { from: nowDate, to: nowDate },
        },
        {
          value: "last_7_days",
          text: "Last 7 days",
          dvalue: {
            from: moment().subtract(7, "days").format("YYYY-MM-DD"),
            to: nowDate,
          },
        },
        {
          value: "this_month",
          text: "This month",
          dvalue: {
            from: moment().startOf("month").format("YYYY-MM-DD"),
            to: nowDate,
          },
        },
        {
          value: "last_month",
          text: "Last month",
          dvalue: {
            from: moment().subtract(1, "months").format("YYYY-MM-DD"),
            to: nowDate,
          },
        },
        {
          value: "this_year",
          text: "This year",
          dvalue: {
            from: moment().startOf("year").format("YYYY-MM-DD"),
            to: nowDate,
          },
        },
        {
          value: "last_12_months",
          text: "Last 12 months",
          dvalue: {
            from: moment().subtract(12, "months").format("YYYY-MM-DD"),
            to: nowDate,
          },
        },
        { value: "custom", text: "Custom" },
      ];
      console.log(`loadRecordings: ${appData.mainDomain}`);

      if (!this.selectedDateRange) {
        this.selectedDateRange = this.dateRanges[3].value;
      }
      this.applyDateRange(this.selectedDateRange);

      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      let getParams = {
        from: this.fromDate,
        to: this.toDate,
        offset: offset,
        limit: limit,
        sortBy: this.options.sortBy,
        sortDesc: this.options.sortDesc,
        search: this.search,
      };

      appUtils
        .get({
          url: "api/recordings",
          params: getParams,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.rows = response.data.results;
            this.totalItems = response.data.count;
            this.savePage();
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateOptions: function (newOptions) {
      console.log(`updateOptions: ${newOptions}`);
      this.savePage();
      this.loadRecordings();
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
    downloadVideo: function () {
      let url = `api/recordings/${this.playItem.session_id}/${this.playItem.start_time}?download=Y`;
      console.log(`downloadVideo: ${url}`);
      //
      appUtils
        .get({
          url,
          responseType: "blob",
        })
        .then((response) => {
          const dataurl = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = dataurl;
          link.setAttribute(
            "download",
            `recording_${this.playItem.session_history.email}_${this.playItem.start_time}.mp4`
          );
          document.body.appendChild(link);
          link.click();
        })
        .catch((error) => {
          console.log(error);
          this.snackbarSave = true;
          this.snackbarText = this.$t("Download Error");
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
      const recordings = this;
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
                backgroundColor: "#000000",
              },
            },
          ],
          controls: [
            {
              position: "right",
              //html: '<button type="button">Click Me!</button>',
              html: '<i class="art-icon mdi mdi-download player-icon" />',
              click: function () {
                // The second parameter is an event object
                console.log("Download!");
                recordings.downloadVideo();
              },
            },
          ],
        });
        let startTimeSec = new Date(this.playItem.start_time).getTime() / 1000;
        this.art.on("video:timeupdate", () => {
          //console.log(`Time update: ${arg}`);
          //console.log(arg);
          //console.info(this.art.currentTime);
          let str = moment(
            new Date((startTimeSec + this.art.currentTime) * 1000)
          ).format("LL LTS");
          document.getElementById("vidts").textContent = `${str}`;
        });
        console.log(`url: ${url}`);
      }, 1000);
    },
  },
  created: function () {
    let bcItems = [
      {
        text: appData.productName,
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
    search: function (newVal) {
      console.log(`search: ${newVal}`);
      this.savePage();
      if (newVal.length > 1 || newVal.length == 0) {
        this.loadRecordings();
      }
    },
    toDate(val) {
      if (this.customdDateRange) {
        console.log(`toDate watch: ${val}`);
        this.loadRecordings();
      }
    },
    fromDate(val) {
      if (this.customdDateRange) {
        console.log(`fromDate watch: ${val}`);
        this.loadRecordings();
      }
    },
    profileSearch: function (newVal) {
      console.log(`profileSearch: ${newVal}`);
      this.savePage();
      if (newVal.length > 1 || newVal.length == 0) {
        this.refreshProfiles();
      }
    },
    profilesSelected: function (arr) {
      console.log(`profilesSelected: ${JSON.stringify(arr, null, 2)}`);
      let addKeys = {};
      arr.forEach((element) => {
        addKeys[element.email] = element.email;
        //console.log(`Add ${element.email}`);
      });
      Object.assign(this.allSelected, addKeys);
      this.profilesRows.forEach((element) => {
        if (!addKeys[element.email]) {
          //delKeys[element.email] = element.email;
          delete this.allSelected[element.email];
          //console.log(`Remove ${element.email}`);
        }
      });
      if (Object.keys(this.allSelected).length > 0) {
        this.addSelectedDisabled = false;
      } else {
        this.addSelectedDisabled = true;
      }
      //console.log("addSelectedDisabled: "+this.addSelectedDisabled);

      //console.log("allSelected: "+JSON.stringify(this.allSelected,null,2));
    },
  },
};
export default page;
</script>