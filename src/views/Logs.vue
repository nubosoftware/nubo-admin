<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title> {{ $t("Logs") }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="events"> {{ $t("Events") }} </v-tab>
          <v-tab key="list" v-if="appData.checkPermission('@/','r')"> {{ $t("Syslog") }} </v-tab>
          
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
     
       <v-tab-item key="events" class="bg">
         <v-data-table
          :headers="eventsHeaders"
          :items="eventsRows"
          :items-per-page="20"
          :loading="eventsLoading"
          :search="eventsSearch"
          class="elevation-1 ma-4 bg"
        >
        <template v-slot:top>
            <v-toolbar flat color="bg">
              
              <v-spacer></v-spacer>
              <v-text-field
                v-model="eventsSearch"
                append-icon="mdi-magnify"
                :label="$t('Search')"
                single-line
                hide-details
              ></v-text-field>
            </v-toolbar>
          </template>
        <template v-slot:[`item.time`]="{ item }">
          {{ moment(item.time).format("LLL") }}
        </template>
        </v-data-table>
       </v-tab-item>
        <v-tab-item key="list" class="bg">
        <v-data-table
          color="bg"
          :headers="headers"
          :items="rows"
          :server-items-length="totalItems"
          :items-per-page="10"
          :loading="loading"
          :options.sync="options"
          :search="search"
          class="ma-4 bg"
          multi-sort
          @update:options="updateOptions"
          @click:row="rowClick"
        >
          <template v-slot:top>
            <v-toolbar flat color="bg">
              
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
              ></v-text-field>
            </v-toolbar>
          </template>
          <template v-slot:[`header.ComponentType`]="{ header }">
            <v-combobox
              v-model="selectComponentType"
              :items="itemsComponentType"
              :label="header.text"
              class="input-combobox"
              @change="compChanged"
            ></v-combobox>
          </template>
          <template v-slot:[`header.ServerName`]="{ header }">
            <v-combobox
              v-model="selectServerName"
              :items="itemsServerName"
              :label="header.text"
              class="input-combobox"
              @change="serverNameChanged"
            ></v-combobox>
          </template>
          <template v-slot:[`header.LogLevel`]="{ header }">
            <v-combobox
              v-model="selectLogLevel"
              :items="itemsLogLevel"
              :label="header.text"
              class="input-combobox"
              @change="logLevelChanged"
            ></v-combobox>
          </template>
          <template v-slot:[`item.LogLevel`]="{ item }">
              <v-chip
                v-if="item.LogLevel <= 3"
                class="ma-2"
                color="error"
                text-color="white"
              >
                {{$t("Error")}}
              </v-chip>
              <v-chip
                v-else-if="item.LogLevel == 4"
                class="ma-2"
                color="warning"
                text-color="white"
              >
                {{$t("Warning")}}
              </v-chip>
              <v-chip
                v-else-if="item.LogLevel <= 6 "
                class="ma-2"
              >
                {{$t("Information")}}
              </v-chip>
              <v-chip
                v-else
                class="ma-2"
                
              >
                {{$t("Debug")}}
              </v-chip>
             
            </template>
            <template v-slot:[`item.Time`]="{ item }">
              {{ moment(item.Time).format("LLL") }}
            </template>
        </v-data-table>
      </v-tab-item>
       
    </v-tabs-items>
  </v-card>

  <!--<v-btn @click="refresh">Refresh</v-btn>-->
</template>


<style>

.input-combobox {
  height: 40px;
  font-size: 10pt;
}
.v-label {
  height: 40px;
  font-size: 10pt;
}
</style>

 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
const moment = require("moment");

let page = {
  name: "Logs",
  data: () => ({
    tab: {},
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    selectComponentType: [],
    itemsComponentType: [],
    selectServerName: [],
    itemsServerName: [],
    selectLogLevel: [],
    itemsLogLevel: [],
    logLevel: 1000,
    comp: null,
    serverName: null,
    eventsHeaders: [],
    eventsRows: [],
    eventsSearch : "",
    eventsLoading: false,
    moment,
    appData,
  }),
  methods: {
    updateOptions(options) {
      console.log("update:options", options);
      this.refresh();
    },

    rowClick: function (val) {
      console.log(`rowClick: ${val.email}`);
      //this.$router.push("/Profile/" + val.email);
    },

    
    refresh: function () {
      /*if (!this.appData.isEnterpriseEdition()) {
        return;
      }*/
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      let s = Math.round(new Date().getTime() / 1000 - 60 * 60 * 24 * 5);
      console.log(`refresh..`);
      appUtils
        .post({
          url: "api/logs",
          data: {
            s: s,
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search,
            level: this.logLevel,
            comp: this.comp,
            serverName: this.serverName
          },
        })
        .then((response) => {
          console.log(`refresh reponse..`);
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.logs;
            this.totalItems = response.data.count;
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },

    logLevelChanged: function(val) {
      console.log(val);
      this.logLevel = val.value;
      this.refresh();
    },
    compChanged: function(val) {
      console.log(val);
      this.comp = val;
      this.refresh();
    },
    serverNameChanged: function(val) {
      console.log(val);
      this.serverName = val;
      this.refresh();
    },
    getFilters: function () {
      /*if (!this.appData.isEnterpriseEdition()) {
        return;
      }*/
      console.log("getFilters");
      appUtils
        .get({
          url: "api/logs/getFilters",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            //this.filters = response.data;
            this.itemsComponentType = [];
            response.data.ComponentType.forEach(item => {
              if (item.ComponentType != "")
                this.itemsComponentType.push(item.ComponentType)
            });
            this.itemsServerName = [];
            response.data.ServerName.forEach(item => {
              if (item.ServerName != "")
                this.itemsServerName.push(item.ServerName)
            });
            this.itemsLogLevel = [
              { value: "3", text: this.$t("Error")},
              { value: "4", text: this.$t("Warning")},
              { value: "6", text: this.$t("Info")},
              { value: "7", text: this.$t("Debug")},
            ];
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    refreshEvents: function(){
      this.eventsLoading = true;
      appUtils
        .get({
          url: "api/events",
        })
        .then((response) => {
          this.eventsLoading = false;
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.eventsRows = response.data.events;
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
        this.eventsHeaders = [
          { text: this.$t("Time"), value: "time" },
          { text: this.$t("Event Type"), value: "eventTypeStr" },
          { text: this.$t("User"), value: "email" },
          { text: this.$t("Information"), value: "extrainfo" },
        ];
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
        text: this.$t("Logs"),
        to: "/Logs",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      /*{
        text: this.$t("ID"),
        value: "ID",
      },*/
      
      { text: this.$t("Time"), value: "Time" },
      { text: this.$t("Log Level"), value: "LogLevel" },
      { text: this.$t("Server Name"), value: "ServerName" },
      { text: this.$t("Component Type"), value: "ComponentType" },
      { text: this.$t("Message"), value: "Message" },
      
      
    ];
    this.getFilters();
  },
  watch: {
    tab: function (newVal) {
      //console.log(`tab: ${newVal}`);
      if (newVal == 0) {
        this.refreshEvents();
      }
      
    },
    
    search: function (newVal) {
      console.log(`search: ${newVal}`);
      if (newVal.length > 1 || newVal.length == 0) {
        this.refresh();
      }
    },
  },
};

export default page;
</script>