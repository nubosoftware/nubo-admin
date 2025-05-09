<template>
    <v-card color="bg">

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

              <template v-slot:[`item.createdAt`]="{ item }">
                {{ moment(item.createdAt).format("LLL") }}
              </template>
              <template v-slot:[`item.duration`]="{ item }">
                {{ formatDuration(item) }}
              </template>
              <template v-slot:[`item.sessionTitle`]="{ item }">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <span v-bind="attrs" v-on="on">{{ item.sessionTitle }}</span>
                  </template>
                  <span>{{ getSessionSummary(item) }}</span>
                </v-tooltip>
              </template>
          </v-data-table>

    </v-card>

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
  import contextUpdater from "../mixins/contextUpdater";
  const moment = require("moment");

  let page = {
    name: "Session Monitor - List",
    mixins: [contextUpdater],
    data: () => ({
      tab: {},
      headers: [],
      rows: [],
      search: "",
      totalItems: 0,
      loading: true,
      options: {},
      moment,
      appData,
    }),
    methods: {
      savePage: function () {
        appUtils.savePageData(`${page.name}`,this,['search','options']);

        // Update context when page state is saved
        this.updateContext({
          view: 'list',
          searchTerm: this.search,
          sortOptions: this.options,
          sessionCount: this.rows.length,
          totalSessions: this.totalItems
        });
      },
      formatDuration: function(item) {
        if (!item.end_time || !item.start_time) return "0 seconds";
        const seconds = moment(item.end_time).diff(moment(item.start_time), 'seconds');
        console.log('Duration:', seconds,"start",item.start_time,"end",item.end_time);
        if (!seconds) return "0 seconds";

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let result = "";
        if (hours > 0) {
          result += `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        }
        if (minutes > 0) {
          if (result) result += ", ";
          result += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
        }
        if (remainingSeconds > 0 || result === "") {
          if (result) result += ", ";
          result += `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
        }

        return result;
      },
      getSessionSummary(item) {
        if (item.sessionSummary) {
          return item.sessionSummary;
        }
        if (item.metadata) {
          const metadata = JSON.parse(item.metadata);
          if (metadata.sessionSummary) {
            item.sessionSummary = metadata.sessionSummary;
            return metadata.sessionSummary;
          }
        }
        return this.$t("No summary available");
      },
      updateOptions(options) {
        console.log("update:options", options);
        this.refresh();
        this.savePage();
      },

      rowClick: function (val) {
        console.log(`rowClick: ${val.id}`);

        // Update context before navigating to session view
        this.updateContext({
          view: 'selecting',
          selectedSession: {
            id: val.id,
            email: val.email,
            createdAt: val.createdAt,
            duration: this.formatDuration(val),
            sessionTitle: val.sessionTitle,
            deviceTitle: val.deviceTitle,
            status: val.status
          }
        });

        this.$router.push({ name: 'SessionView', params: { id: val.id } });
      },


      refresh: function () {
        let limit =
          this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
        let offset = (this.options.page - 1) * limit;
        // let s = Math.round(new Date().gtTime() / 1000 - 60 * 60 * 24 * 5);
        console.log(`refresh..`);

        // Update context with loading state
        this.updateContext({
          view: 'loading',
          searchTerm: this.search,
          sortOptions: this.options,
          loading: true
        });

        appUtils
          .post({
            url: "api/memsy-session",
            data: {
            //   s: s,
              offset: offset,
              limit: limit,
              sortBy: this.options.sortBy,
              sortDesc: this.options.sortDesc,
              search: this.search,
            //   level: this.logLevel,
            //   comp: this.comp,
            //   serverName: this.serverName
            },
          })
          .then((response) => {
            console.log(`refresh reponse..`);
            console.log(response.data);
            if (response.data.status == 1) {
              this.rows = response.data.sessions;
              this.totalItems = response.data.count;

              // Update context with successful data fetch
              this.updateContext({
                view: 'list',
                searchTerm: this.search,
                sortOptions: this.options,
                sessionCount: this.rows.length,
                totalSessions: this.totalItems,
                sessions: this.rows.map(session => ({
                  id: session.id,
                  email: session.email,
                  createdAt: session.createdAt,
                  deviceTitle: session.deviceTitle,
                  status: session.status,
                  sessionTitle: session.sessionTitle
                })),
                lastFetched: new Date().toISOString(),
                loading: false
              });
            } else {
              console.log(`status: ${response.data.status}`);

              // Update context with error
              this.updateContext({
                view: 'error',
                error: `Failed to fetch sessions (status: ${response.data.status})`,
                loading: false
              });
            }
          })
          .catch((error) => {
            console.log(error);

            // Update context with error
            this.updateContext({
              view: 'error',
              error: `Error fetching sessions: ${error}`,
              loading: false
            });
          })
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

     },
    created: function () {
      let bcItems = [
        {
          text: appData.productName,
          to: "/",
          disabled: false,
        },
        {
          text: this.$t("Session Monitor"),
          to: "/SessionMonitor",
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
      this.headers = [
        /*{
          text: this.$t("ID"),
          value: "ID",
        },*/

        { text: this.$t("Time"), value: "createdAt" },
        { text: this.$t("Duration"), value: "duration" },
        { text: this.$t("User"), value: "email" },
        { text: this.$t("Summary"), value: "sessionTitle" },
        { text: this.$t("Device"), value: "deviceTitle" },
        { text: this.$t("Status"), value: "status" },
        { text: this.$t("ID"), value: "id" },


      ];
      appUtils.loadPageData(page.name,this);

      // Initialize context when component is created
      this.updateContext({
        view: 'init',
        pageType: 'MemsySessionsList',
        headers: this.headers.map(h => h.text || h.value),
        permissions: {
          canView: appData.checkPermission('/', 'r')
        },
        lastInitialized: new Date().toISOString()
      });

      this.getFilters();
    },
    watch: {
      tab: function (newVal) {
        console.log(`tab: ${newVal}`);
        this.savePage();
      },

      search: function (newVal) {
        console.log(`search: ${newVal}`);

        // Update context when search term changes
        this.updateContext({
          view: 'searching',
          searchTerm: newVal,
          isSearching: newVal.length > 0
        });

        if (newVal.length > 1 || newVal.length == 0) {
          this.refresh();
          this.savePage();
        }
      },
    },
  };

  export default page;
  </script>