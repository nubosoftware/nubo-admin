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
          <v-tab key="files" v-if="appData.checkPermission('@/','r')"> {{ $t("Files") }} </v-tab>
          <v-tab key="versions" v-if="appData.checkPermission('@/','r')"> {{ $t("Versions") }} </v-tab>

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
      <v-tab-item key="file" class="bg">
        <v-data-table
          v-if="!filesError"
          :headers="fileHeaders"
          :items="files"
          :items-per-page="20"
          :loading="filesLoading"
          @click:row="downloadFile"
          :options.sync="fileOptions"
          @update:options="updateFileOptions"
          class="elevation-1 ma-4 bg"
        >
        <template v-slot:[`item.size`]="{ item }">
          {{ item.sizeStr }}
        </template>
        <template v-slot:[`item.lastModified`]="{ item }">
          {{ moment(item.lastModified).format("LLL") }}
        </template>
        </v-data-table>
        <v-alert
          v-else
          :value="true"
          :type=filesAlertType
          class="ma-4"
        >
          {{ filesError }}
        </v-alert>
      </v-tab-item>
      <v-tab-item key="versions" class="bg">
        <v-data-table
          v-if="!filesError"
          :headers="versionsHeaders"
          :items="versions"
          :items-per-page="20"
          :loading="filesLoading"
          class="elevation-1 ma-4 bg"
        >
          <template v-slot:[`item.componentName`]="{ item }">
            <v-icon class="mr-2">
              {{ getComponentIcon(item.componentName) }}
            </v-icon>
            {{ item.componentName }}
          </template>
          <template v-slot:[`item.buildTime`]="{ item }">
            {{ item.buildTime ? moment(item.buildTime).format("LLL") : '' }}
          </template>
          <template v-slot:[`item.componentIndex`]="{ item }">
            {{ ['android-nubo-platform', 'management' ,'mysql'].includes(item.componentName) ? '' : item.componentIndex }}
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
    files: [],
    fileHeaders: [],
    fileOptions: {},
    filesError: false,
    filesAlertType: "error",
    versions: [],
    versionsHeaders: [],
    versionsLoading: false,
    moment,
    appData,
  }),
  methods: {
    savePage: function () {
      appUtils.savePageData(`${page.name}`,this,['tab','options','fileOptions']);
    },
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
    refreshFiles: async function () {
       try {
         const response = await appUtils.get({
          url: "api/logs/files"
         });
         console.log(response.data);
         if (response.data.status == 1) {
           console.log(`status: ${response.data.status}`);
           this.files = response.data.files;
           this.fileHeaders = [
             { text: this.$t("File"), value: "path" },
             { text: this.$t("Size"), value: "size" },
             { text: this.$t("Last Modified"), value: "lastModified" },
           ]
         } else {
           console.log(`status: ${response.data.status}`);
           if (response.data.status == 2)  {
            this.filesError = "Logs download is disabled";
            this.filesAlertType = "warning";
           } else {
            this.filesError = response.data.message || `Error: ${response.data.status}`;
            this.filesAlertType = "error";
           }
         }
       } catch (error) {
         console.log(error);
       }
     },
     updateFileOptions(options) {
       console.log("updateFileOptions", options);
       this.savePage();
     },
     downloadFile: async function (val) {
       console.log(`downloadFile: ${val.path}`);
       try {
         const escapedPath = encodeURIComponent(val.path);
         const response = await appUtils.get({
           url: "api/logs/files/" + escapedPath,
           responseType: 'blob'
         });
         console.log(response.data);
         if (response.data instanceof Blob) {
           console.log('Response is of type application/octet-stream');
           const url = window.URL.createObjectURL(new Blob([response.data]));
           const link = document.createElement('a');
           link.href = url;
           link.setAttribute('download', val.path);
           document.body.appendChild(link);
           link.click();
         } else {
           console.log('Response is of type JSON');
           console.log(`status: ${response.data.status}`);
         }
       } catch (error) {
         console.log(error);
       }
     },
     refreshVersions: async function () {
       console.log("refreshVersions");
       this.versionsLoading = true;
       try {
         const response = await appUtils.get({
          url: "api/system/versions"
         });
         console.log(response.data);
         if (response.data.status == 1) {
           this.versions = response.data.results;
           this.versionsHeaders = [
             { text: this.$t("Component Name"), value: "componentName" },
             { text: this.$t("Component Index"), value: "componentIndex" },
             { text: this.$t("Version"), value: "version" },
             { text: this.$t("Build Time"), value: "buildTime" },
           ]
         }
         this.versionsLoading = false;
       } catch (error) {
         console.log(error);
         this.versionsLoading = false;
       }
     },
     getComponentIcon(componentName) {
       const iconMap = {
         'android-nubo-platform': 'mdi-android',
         'frontend': 'mdi-desktop-mac-dashboard',
         'gateway': 'mdi-gate',
         'management': 'mdi-account-cog',
         'platform-server': 'mdi-server',
         'mysql': 'mdi-database'
       };
       return iconMap[componentName] || 'mdi-help-circle';
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
    appUtils.loadPageData(page.name,this);
    this.getFilters();
  },
  watch: {
    tab: function (newVal) {
      console.log(`tab: ${newVal}`);
      if (newVal == 0) {
        this.refreshEvents();
      }
      if (newVal == 2) {
        this.refreshFiles();
      }
      if (newVal == 3) {
        this.refreshVersions();
      }
      this.savePage();
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