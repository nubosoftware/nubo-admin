<template>
  <v-card color="bg">
    <v-card-title>{{$t("Platforms")}}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="20"
      :loading="loading"
      @click:row="rowClick"
      v-model="selectedPlatforms"
      item-key="platID"
      show-select
      class="elevation-1 ma-4 bg"
    >
      <template v-slot:top>
        <v-toolbar
          flat
          color="bg"
        >
          <v-btn
                color="primary"
                dark
                class="mb-2"
                @click="startNew"
              >
                {{$t("Start New Platform")}}
              </v-btn>
              <v-btn
                v-if="canSelectedAction('start')"
                class="ma-4"
                color="primary"
                @click="selectedAction('start')"
                >{{ $t("Start Selected") }}
              </v-btn>
              <v-btn
                v-if="canSelectedAction('stop')"
                class="ma-4"
                color="primary"
                @click="selectedAction('stop')"
                >{{ $t("Stop Selected") }}
              </v-btn>
              <v-btn
                v-if="canSelectedAction('enable')"
                class="ma-4"
                color="primary"
                @click="selectedAction('enable')"
                >{{ $t("Enable Selected") }}
              </v-btn>
              <v-btn
                v-if="canSelectedAction('disable')"
                class="ma-4"
                color="primary"
                @click="selectedAction('disable')"
                >{{ $t("Disable Selected") }}
              </v-btn>

        </v-toolbar>
      </template>
      <template v-slot:[`item.status`]="{ item }">
        <v-chip
          v-if="item.status == 'running'"
          class="ma-2"
          color="success"
          text-color="white"
        >
          {{$t("Running")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'error'"
          class="ma-2"
          color="error"
          text-color="white"
        >
          {{$t("Error")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'revive'"
          class="ma-2"
          color="warning"
          text-color="white"
        >
          {{$t("Revive")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'starting'"
          class="ma-2"
          color="warning"
          text-color="white"
        >
          {{$t("Starting")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'stopping'"
          class="ma-2"
          color="warning"
          text-color="white"
        >
          {{$t("Stopping")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'available'"
          class="ma-2"
          
          text-color="white"
        >
          {{$t("Available")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'not_available'"
          class="ma-2"
          text-color="white"
        >
          {{$t("Disabled")}}
        </v-chip>
        
      </template>
      <template v-slot:[`item.actions`]="{ item }">
             <v-icon v-if="item.status == 'running' || item.status == 'error' || item.status == 'revive'" small @click="stopCheck(item,$event)" class="mx-2"> mdi-stop </v-icon>
             <v-icon v-if="item.status == 'available' || item.status == 'not_available'" small @click="start(item,$event)" class="mx-2"> mdi-play </v-icon>
             <v-icon v-if="item.status !== 'not_available'" small @click="disableCheck(item,$event)" class="mx-2"> mdi-cancel </v-icon>
             <v-icon v-if="item.status == 'not_available'" small @click="enableClick(item,$event)" class="mx-2"> mdi-check </v-icon>
            </template>
    </v-data-table>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="590"
    >      
      <v-card>
        <v-card-title v-if="!isDisableCmd" >
          {{$t("Stop platform",{stopPlatID: stopPlatID})}}
        </v-card-title>
        <v-card-title v-if="isDisableCmd" >
          {{$t("Disable platform",{stopPlatID: stopPlatID})}}
        </v-card-title>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="dialog = false"
          >
            {{$t('Cancel')}}
          </v-btn>
          <v-btn
            v-if="stopStatus == 'running' && !isDisableCmd"
            color="green darken-1"
            text
            @click="stopGracefully"
          >
            {{$t('Stop Gracefully')}}
          </v-btn>
          <v-btn
            v-if="!isDisableCmd"
            color="orange darken-1"
            text
            @click="stopNow"
          >
            {{$t('Stop Now')}}
          </v-btn>
          <v-btn
            v-if="isDisableCmd && (stopStatus == 'running' || stopStatus == 'error' || stopStatus == 'revive' )"
            color="orange darken-1"
            text
            @click="disableAndStopNow"
          >
            {{$t('Stop and Disable')}}
          </v-btn>
          <v-btn
            v-if="isDisableCmd && (stopStatus != 'running' && stopStatus != 'error' && stopStatus != 'revive' )"
            color="orange darken-1"
            text
            @click="disableNow"
          >
            {{$t('Disable')}}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="actionDialog"
      persistent
      max-width="590"
    >      
      <v-card>        
        <v-card-title >
          {{actionDialogTitle}}
        </v-card-title>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="actionDialog = false"
          >
            {{$t('Cancel')}}
          </v-btn>
          <v-btn            
            color="green darken-1"
            text
            @click="actionDialogClick"
          >
          {{actionDialogBtn}}
          </v-btn>          
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn color="info" text v-bind="attrs" @click="snackbarSave = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
const moment = require("moment");

let page = {
  name: "Platforms",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialog: false,
    stopPlatID: 0,
    stopStatus: "",
    selectedPlatforms: [],
    actionDialog: false,
    actionDialogTitle: "",
    actionDialogBtn: "",
    selectedActionType: "",
    isDisableCmd: false,
    snackbarSave: false,    
    snackbarText: "",
    appData,
  }),
  methods: {
    rowClick: function (val) {
      console.log(`rowClick: ${val.platID}`);
      this.$router.push("/Platform/" + val.platID );
    },
    stopCheck: function (val,event) {
      event.stopPropagation();
      this.stopStatus = val.status;
      this.stopPlatID = val.platID;
      this.isDisableCmd = false;
      this.dialog = true;
    },
    disableCheck: function (val,event) {
      event.stopPropagation();
      this.stopStatus = val.status;
      this.stopPlatID = val.platID;
      this.isDisableCmd = true;
      this.dialog = true;
    },
    scheduleLongOperCheck: function(notifToken,title) {
      console.log("scheduleLongOperCheck: "+notifToken);
      appUtils.get({
        url: "api/longOperations/"+notifToken,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 50) {
            setTimeout(this.scheduleLongOperCheck,5000,notifToken,title);
          } else if (response.data.status == 1) {
            console.log("response.data.status == 1");
            this.$notification.success(response.data.message, { title:title, infiniteTimer: true ,showCloseIcn : true});
          } else {
            console.log("response.data.status != 1");
            this.$notification.error(response.data.message, { title:title, infiniteTimer: true ,showCloseIcn : true});
          }
      }).catch((error) => console.log(error));
    },
    disableAndStopNow: function() {
      this.stop(false);
      this.disable();
    },
    disableNow: function() {     
      this.disable();
    },
    disable: function () {
      this.dialog = false;
      appUtils.get({
        url: `api/platforms/${this.stopPlatID}/disable`,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Disabled platform")+" "+this.stopPlatID;
            this.snackbarSave = true;            
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    enableClick: async function(item,event) {
      event.stopPropagation();
      try {
        await this.enable(item.platID);
        this.snackbarText = this.$t("Enabled platform")+" "+item.platID;
        this.snackbarSave = true;
      } catch (err) {
        console.log(`Error: ${err}`);
        this.snackbarText = this.$t("Error");
        this.snackbarSave = true;
      }
    },
    enable: async function (platID) {
      this.dialog = false;
      await appUtils.get({
        url: `api/platforms/${platID}/enable`,
      });
    },
    stopGracefully: function() {
      //console.log(`stopGracefully`);
      this.stop(true);
    },
    stopNow: function() {
      //console.log(`stopNow`);
      this.stop(false);
    },     
    stop: function(gracefully) {
      
      this.dialog = false;
      let params = (gracefully ? "?gracefully=Y" : "?gracefully=N");
      console.log(`stop: ${this.stopPlatID}, gracefully: ${gracefully}`);
      appUtils.delete({
        url: "api/platforms/"+this.stopPlatID+params,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Stopping platform")+" "+this.stopPlatID;
            this.snackbarSave = true;
            if (response.data.notifToken) {
              this.scheduleLongOperCheck(response.data.notifToken,this.$t("Stopping platform")+" "+this.stopPlatID)
            }
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    canSelectedAction: function(action) {
      if (this.selectedPlatforms.length == 0) {
        return false;
      }
      let cnt = 0;
      this.selectedPlatforms.forEach(item => {
        if (action == "start") {
          if (item.status == "available" || item.status == "not_available") {
            cnt++;
          }
        } else if (action == "stop") {
          if (item.status == "running" || item.status == "error") {
            cnt++;
          }
        } else if (action == "enable") {
          if (item.status == "not_available") {
            cnt++;
          }
        } else if (action == "disable") {
          if (item.status != 'not_available') {
            cnt++;
          }
        } 
      });
      return cnt > 0;
    },
    selectedAction: function(action) {
      this.selectedActionType = action;
      if (action == "start") {
        this.actionDialogTitle = this.$t("Start selected platforms?");
        this.actionDialogBtn = this.$t("Start");
      } else if (action == "stop") {
        this.actionDialogTitle = this.$t("Stop selected platforms?");
        this.actionDialogBtn = this.$t("Stop");
      } else if (action == "enable") {
        this.actionDialogTitle = this.$t("Enable selected platforms?");
        this.actionDialogBtn = this.$t("Enable");
      } else if (action == "disable") {
        this.actionDialogTitle = this.$t("Disable selected platforms?");
        this.actionDialogBtn = this.$t("Disable");
      }
      this.actionDialog = true;
    },
    actionDialogClick: function() {
      this.actionDialog = false;
      let action = this.selectedActionType;
      this.selectedPlatforms.forEach(item => {
        if (action == "start") {
          if (item.status == "available" || item.status == "not_available") {
            this.start(item);
          }
        } else if (action == "stop") {
          if (item.status == "running" || item.status == "error") {
            this.stopPlatID = item.platID;
            this.stop(false);
          }
        } else if (action == "enable") {
          this.enable(item.platID);
        } else if (action == "disable") {
          this.stopPlatID = item.platID;
          this.stop(false);
          this.disable();
        } 
      });
    },
    startNew: function() {
      let starting = false;
      this.rows.forEach(item => {
        if (!starting && item.status == "available") {
          starting = true;
          this.start(item);
        }
      });
      if (!starting) {
        this.snackbarText = this.$t("Cannot find available platform");
        this.snackbarSave = true;
      }
    },
    start: async function(item,event) {
      event.stopPropagation();
      try {        
        if (item.status == 'not_available') {
          await this.enable(item.platID);
        }
        let response = await appUtils.put({
          url: "api/platforms/"+item.platID,
        });
        console.log(response.data);
        if (response.data.status == 1) {
          this.snackbarText = this.$t("Starting platform")+" "+item.platID;
          this.snackbarSave = true;
          if (response.data.notifToken) {
            this.scheduleLongOperCheck(response.data.notifToken,this.$t("Starting platform")+" "+item.platID)
          }
        } else {
          console.log(`status: ${response.data.status}`);
          this.snackbarText = this.$t("Error");
          this.snackbarSave = true;
        }
      } catch (err) {
        console.log(`Error: ${err}`);
        this.snackbarText = this.$t("Error");
        this.snackbarSave = true;
      }
      // appUtils
      //   .put({
      //     url: "api/platforms/"+item.platID,
      //   })
      //   .then((response) => {
      //     console.log(response.data);
      //     if (response.data.status == 1) {
      //       this.snackbarText = this.$t("Starting platform")+" "+item.platID;
      //       this.snackbarSave = true;
      //       if (response.data.notifToken) {
      //         this.scheduleLongOperCheck(response.data.notifToken,this.$t("Starting platform")+" "+item.platID)
      //       }
      //     } else {
      //       console.log(`status: ${response.data.status}`);
      //       this.snackbarText = this.$t("Error");
      //       this.snackbarSave = true;
      //     }
      //   })
      //   .catch((error) => console.log(error))
      //   .finally(() => (this.loading = false));
    },
    printMem: function(bytes) {
      if (isNaN(bytes)) {
        return "";
      }
      const kb = bytes / 1024;
      if (kb<1) {
        return `${bytes} bytes`;
      }
      const mb = kb / 1024;
      if (mb<1) {
        return `${kb.toFixed(1)} kb`;
      }
      const gb = mb / 1024;
      if (gb<1) {
        return `${mb.toFixed(1)} mb`;
      }
      return `${gb.toFixed(1)} gb`;
    },
    refresh: function () {
      console.log("Platforms refresh. route: "+this.$route.name);
      if (this.$route.name != "Platforms") {
        return;
      }
      appUtils
        .get({
          url: "api/platforms",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            for (const plat of response.data.platforms) {
              plat.availMem = (plat.params ? `${this.printMem(plat.params.memAvailable)}` : "");
              plat.cpuLoad = (plat.params && !isNaN(plat.params.currentLoad) ? `${(plat.params.currentLoad * 1).toFixed(1)}%` : "");
              plat.uptime = (plat.params  && plat.params.startTime ? moment(plat.params.startTime).fromNow() : "");
            }
            this.rows = response.data.platforms;
            setTimeout(this.refresh,5000);
          } else {
            console.log(`status: ${response.data.status}`);
            this.rows = [];
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
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
        text: this.$t("Platforms"),
        to: "/Platforms",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Platform ID"),
        value: "platID",
      },
      {
        text: this.$t("Status"),
        value: "status",
      },
      {
        text: this.$t("Current Sessions"),
        value: "sessions",
      },
      {
        text: this.$t("Created Sessions"),
        value: "params.created_sessions_cnt",
      },
      {
        text: this.$t("Available Memory"),
        value: "availMem",
      },
      {
        text: this.$t("CPU Load"),
        value: "cpuLoad",
      },
      {
        text: this.$t("Up Time"),
        value: "uptime",
      },
      {
        text: this.$t("IP Address"),
        value: "platform_ip",
      },
      
      { text: 'Actions', value: 'actions', sortable: false }
    ];
    this.refresh();
    //
  },
};

export default page;
</script>