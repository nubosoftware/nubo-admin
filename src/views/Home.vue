<template>
  <v-card color="bg">
    <v-card-title>
      {{ $t("Dashboard") }}
    </v-card-title>
    <v-form>
            <v-container>
              <v-row>
                <v-col cols="12" sm="7" md="4">
                  <v-card color="bg">
                    <v-card-title>{{$t("Users")}}</v-card-title>
                    <v-card-subtitle>{{dashboard.onlineUsers}} {{$t("users are online")}}</v-card-subtitle>
                    <pie-chart :chart-data="onlineUsers"></pie-chart>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="7" md="4" v-if="appData.checkPermission('@/','r')" >
                  <v-card color="bg">
                    <v-card-title>{{$t("Platforms")}}</v-card-title>
                    <v-card-subtitle>{{dashboard.runningPlatforms}} {{$t("platforms are up")}}</v-card-subtitle>
                    <pie-chart :chart-data="platforms"></pie-chart>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="7" md="4">
                  <v-card color="bg">
                    <v-card-title>{{$t("Devices")}}</v-card-title>
                    <v-card-subtitle>{{dashboard.onlineDevices}} {{$t("devices are online")}}</v-card-subtitle>
                    <pie-chart :chart-data="onlineDevices"></pie-chart>
                  </v-card>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="7" md="4" v-if="appData.checkPermission('@/','r')" >
                  <v-card color="bg">
                    <v-card-title>{{$t("Storage")}}</v-card-title>
                    <v-card-subtitle>{{$t("Using")}} {{dashboard.totalUsedSpaceMB / 1000}} GB out of {{dashboard.totalSpaceMB / 1000}} GB</v-card-subtitle>
                    <pie-chart :chart-data="storage"></pie-chart>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="7" md="4">
                  <v-card color="bg">
                    <v-card-title>{{$t("Device Names")}}</v-card-title>
                    <pie-chart :chart-data="deviceTypes"></pie-chart>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="7" md="4">
                  <v-card color="bg">
                    <v-card-title>{{$t("Sessions")}}</v-card-title>
                    <v-card-subtitle>{{$t("Online sessions over time")}}</v-card-subtitle>
                    <line-chart :chart-data="lastSessions" :options="lastSessionsOptions" ></line-chart>
                  </v-card>
                </v-col>
              </v-row>

            </v-container>
          </v-form>
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
import LineChart from './charts/lineChart';
import PieChart from './charts/pieChart';
import contextUpdater from "../mixins/contextUpdater";
const moment = require("moment");

export default {
  name: 'HomePage',
  components: {
      LineChart,
      PieChart,
    },
  mixins: [contextUpdater],
  data: () => ({
    dashboard: {},
    datacollection: null,
    snackbarSave: false,
    snackbarText: "",
    lastSessionsOptions: {},
    onlineUsers: {},
    platforms: {},
    onlineDevices: {},
    storage: {},
    deviceTypes: {},
    lastSessions: {},
    appData
  }),
  methods: {
    fillData () {
      let colors = this.$vuetify.theme.themes.light;
      //console.log(`dashboard: ${JSON.stringify(this.dashboard,null,2)}`);
      this.onlineUsers = {
        datasets: [{
            data: [this.dashboard.onlineUsers, this.dashboard.totalUsers ],
            backgroundColor: [
              colors.success , colors.warning
            ]
        }],
        labels: [
            this.$t('Online'),
            this.$t('Offline')
        ]
      };
      this.onlineDevices = {
        datasets: [{
            data: [this.dashboard.onlineDevices, this.dashboard.totalDevices ],
            backgroundColor: [
              colors.success , colors.warning
            ]
        }],
        labels: [
            this.$t('Online'),
            this.$t('Offline')
        ]
      };
      if (this.dashboard.deviceNames) {
        const deviceTypesData = this.dashboard.deviceNames.map((item) => item.count );
        const deviceTypesLabels = this.dashboard.deviceNames.map((item) =>  item.devicename );
        const randomNum = () => Math.floor(Math.random() * (235 - 52 + 1) + 52);
        const randomRGB = () => `rgb(${randomNum()}, ${randomNum()}, ${randomNum()})`;
        const deviceTypesColors = this.dashboard.deviceNames.map(randomRGB);
        //console.log(`deviceTypesColors: ${JSON.stringify(deviceTypesColors,null,2)}`);
        //console.log(`colors.warning: ${colors.warning}`);
        this.deviceTypes = {
          datasets: [{
              data: deviceTypesData,
              backgroundColor: deviceTypesColors
          }],
          labels: deviceTypesLabels
        };
        // backgroundColor: [
        //         colors.success , colors.error, colors.warning
        //       ]
      } else {
        this.deviceTypes = {
          datasets: [{
              data: [this.dashboard.androidDevices, this.dashboard.iPhoneDevices,
                this.dashboard.totalDevices - this.dashboard.androidDevices - this.dashboard.iPhoneDevices ],
              backgroundColor: [
                colors.success , colors.error, colors.warning
              ]
          }],
          labels: [
              this.$t('Android'),
              this.$t('iOS'),
              this.$t('Other')
          ]
        };
      }
      this.platforms = {
        datasets: [{
            data: [this.dashboard.runningPlatforms, this.dashboard.availablePlatforms - this.dashboard.runningPlatforms ],
            backgroundColor: [
              colors.success , colors.secondary
            ]
        }],
        labels: [
            this.$t('Running'),
            this.$t('Not running')
        ]
      };
      this.storage = {
        datasets: [{
            data: [this.dashboard.totalUsedSpaceMB, this.dashboard.totalSpaceMB > this.dashboard.totalUsedSpaceMB  ? this.dashboard.totalSpaceMB - this.dashboard.totalUsedSpaceMB : 0 ],
            backgroundColor: [
              colors.primary , colors.secondary
            ]
        }],
        labels: [
            this.$t('Used'),
            this.$t('Available')
        ]
      };



      let data = [];
      let labels = [];
      let maxSession = 0;
      if (!this.dashboard.lastSessions) {
        this.dashboard.lastSessions = [];
      }
      this.dashboard.lastSessions.forEach(element => {
        data.push(element.count);
        let m = moment(element.time);
        labels.push(m.format("LT"));
        if (element.count > maxSession) {maxSession = element.count;}
      });

      maxSession = Math.ceil((maxSession+1)/10)*10;

      this.lastSessionsOptions= {
        scales: {
            yAxes: [{
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: maxSession
                }
            }]
        }
      };

      this.lastSessions = {
        datasets: [{
            data: data,
            backgroundColor: colors.primary,
            label: this.$t("Sessions"),
            fill: false,
        }],
        labels: labels,


      };

    },
    getRandomInt () {
      return Math.floor(Math.random() * (50 - 5 + 1)) + 5
    },
    refresh: function() {
      // Update context to show loading state
      this.updateContext({
        view: 'loading',
        loading: true
      });

      appUtils
        .get({
          url: "api/dashboard"
        })
        .then(response => {
          //console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.dashboard = response.data;
            this.fillData();

            // Update context with dashboard data
            this.updateContext({
              view: 'dashboard',
              loading: false,
              dashboardData: {
                users: {
                  total: this.dashboard.totalUsers,
                  online: this.dashboard.onlineUsers
                },
                devices: {
                  total: this.dashboard.totalDevices,
                  online: this.dashboard.onlineDevices,
                  android: this.dashboard.androidDevices,
                  iPhone: this.dashboard.iPhoneDevices
                },
                platforms: {
                  total: this.dashboard.availablePlatforms,
                  running: this.dashboard.runningPlatforms
                },
                storage: {
                  totalGB: Math.round(this.dashboard.totalSpaceMB / 1000),
                  usedGB: Math.round(this.dashboard.totalUsedSpaceMB / 1000)
                },
                sessions: this.dashboard.lastSessions ? this.dashboard.lastSessions.length : 0
              },
              lastUpdated: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");

            // Update context with error
            this.updateContext({
              view: 'error',
              loading: false,
              error: `Failed to load dashboard (status: ${response.data.status})`
            });
          }
        })
        .catch(error => {
          console.log(error);
          this.$router.push("/Login");

          // Update context with error
          this.updateContext({
            view: 'error',
            loading: false,
            error: `Error loading dashboard: ${error}`
          });
        });
    },
  },
  created: function() {
    let bcItems = [{
      text: appData.productName,
      to: "/",
      disabled: false,
    }];
    this.$emit("updatePage", bcItems);

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'Dashboard',
      loading: true,
      lastInitialized: new Date().toISOString()
    });

    this.refresh();
  }
}
</script>
