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
    pageContext: {}, // Store context data for the Platforms page
  }),
  methods: {
    // Add updateContext method to maintain context within the Platforms page
    updateContext: function(contextData) {
      // Preserve existing page context while adding new data
      this.pageContext = {
        ...this.pageContext,
        ...contextData
      };

      // Always include the full pageContext when updating app state
      this.$emit('updateAppState', {
        componentName: this.$options.name || 'Platforms',
        timestamp: new Date().toISOString(),
        ...this.pageContext
      });
    },

    rowClick: function (val) {
      console.log(`rowClick: ${val.platID}`);

      // Update context when clicking on a platform
      this.updateContext({
        view: 'platforms',
        action: 'select_platform',
        selectedPlatform: {
          platID: val.platID,
          status: val.status,
          sessions: val.sessions,
          availMem: val.availMem,
          cpuLoad: val.cpuLoad,
          ipAddress: val.platform_ip
        }
      });

      this.$router.push("/Platform/" + val.platID );
    },

    stopCheck: function (val,event) {
      event.stopPropagation();
      this.stopStatus = val.status;
      this.stopPlatID = val.platID;
      this.isDisableCmd = false;
      this.dialog = true;

      // Update context when opening stop platform dialog
      this.updateContext({
        view: 'platforms',
        action: 'prepare_stop_platform',
        platform: {
          platID: val.platID,
          status: val.status
        }
      });
    },

    disableCheck: function (val,event) {
      event.stopPropagation();
      this.stopStatus = val.status;
      this.stopPlatID = val.platID;
      this.isDisableCmd = true;
      this.dialog = true;

      // Update context when opening disable platform dialog
      this.updateContext({
        view: 'platforms',
        action: 'prepare_disable_platform',
        platform: {
          platID: val.platID,
          status: val.status
        }
      });
    },

    scheduleLongOperCheck: function(notifToken,title) {
      console.log("scheduleLongOperCheck: "+notifToken);

      // Update context when checking long-running operation
      this.updateContext({
        view: 'platforms',
        action: 'check_long_operation',
        notifToken: notifToken,
        operationTitle: title
      });

      appUtils.get({
        url: "api/longOperations/"+notifToken,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 50) {
            setTimeout(this.scheduleLongOperCheck,5000,notifToken,title);

            // Update context with operation still in progress
            this.updateContext({
              view: 'platforms',
              action: 'long_operation_in_progress',
              notifToken: notifToken,
              operationTitle: title
            });
          } else if (response.data.status == 1) {
            console.log("response.data.status == 1");
            this.$notification.success(response.data.message, { title:title, infiniteTimer: true ,showCloseIcn : true});

            // Update context with operation success
            this.updateContext({
              view: 'platforms',
              action: 'long_operation_success',
              notifToken: notifToken,
              operationTitle: title,
              message: response.data.message
            });
          } else {
            console.log("response.data.status != 1");
            this.$notification.error(response.data.message, { title:title, infiniteTimer: true ,showCloseIcn : true});

            // Update context with operation error
            this.updateContext({
              view: 'platforms',
              action: 'long_operation_error',
              notifToken: notifToken,
              operationTitle: title,
              message: response.data.message
            });
          }
      }).catch((error) => {
        console.log(error);

        // Update context with error
        this.updateContext({
          view: 'platforms',
          action: 'long_operation_error',
          notifToken: notifToken,
          operationTitle: title,
          error: `Error: ${error}`
        });
      });
    },

    disableAndStopNow: function() {
      this.stop(false);
      this.disable();

      // Update context when stopping and disabling platform
      this.updateContext({
        view: 'platforms',
        action: 'stop_and_disable_platform',
        platform: {
          platID: this.stopPlatID,
          status: this.stopStatus
        }
      });
    },

    disableNow: function() {
      this.disable();

      // Update context when disabling platform
      this.updateContext({
        view: 'platforms',
        action: 'disable_platform',
        platform: {
          platID: this.stopPlatID,
          status: this.stopStatus
        }
      });
    },

    disable: function () {
      this.dialog = false;

      // Update context when disabling platform
      this.updateContext({
        view: 'platforms',
        action: 'disable_platform_request',
        platform: {
          platID: this.stopPlatID,
          status: this.stopStatus
        }
      });

      appUtils.get({
        url: `api/platforms/${this.stopPlatID}/disable`,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Disabled platform")+" "+this.stopPlatID;
            this.snackbarSave = true;

            // Update context with success
            this.updateContext({
              view: 'platforms',
              action: 'disable_platform_success',
              platform: {
                platID: this.stopPlatID
              }
            });
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;

            // Update context with error
            this.updateContext({
              view: 'platforms',
              action: 'disable_platform_error',
              platform: {
                platID: this.stopPlatID
              },
              error: `Failed with status ${response.data.status}`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'platforms',
            action: 'disable_platform_error',
            platform: {
              platID: this.stopPlatID
            },
            error: `Error: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    enableClick: async function(item,event) {
      event.stopPropagation();

      // Update context when enabling platform
      this.updateContext({
        view: 'platforms',
        action: 'enable_platform',
        platform: {
          platID: item.platID,
          status: item.status
        }
      });

      try {
        await this.enable(item.platID);
        this.snackbarText = this.$t("Enabled platform")+" "+item.platID;
        this.snackbarSave = true;

        // Update context with success
        this.updateContext({
          view: 'platforms',
          action: 'enable_platform_success',
          platform: {
            platID: item.platID
          }
        });
      } catch (err) {
        console.log(`Error: ${err}`);
        this.snackbarText = this.$t("Error");
        this.snackbarSave = true;

        // Update context with error
        this.updateContext({
          view: 'platforms',
          action: 'enable_platform_error',
          platform: {
            platID: item.platID
          },
          error: `Error: ${err}`
        });
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

      // Update context when stopping platform gracefully
      this.updateContext({
        view: 'platforms',
        action: 'stop_platform_gracefully',
        platform: {
          platID: this.stopPlatID,
          status: this.stopStatus
        }
      });
    },

    stopNow: function() {
      //console.log(`stopNow`);
      this.stop(false);

      // Update context when stopping platform immediately
      this.updateContext({
        view: 'platforms',
        action: 'stop_platform_immediately',
        platform: {
          platID: this.stopPlatID,
          status: this.stopStatus
        }
      });
    },

    stop: function(gracefully) {
      this.dialog = false;
      let params = (gracefully ? "?gracefully=Y" : "?gracefully=N");
      console.log(`stop: ${this.stopPlatID}, gracefully: ${gracefully}`);

      // Update context when stopping platform
      this.updateContext({
        view: 'platforms',
        action: 'stop_platform_request',
        platform: {
          platID: this.stopPlatID,
          gracefully: gracefully
        }
      });

      appUtils.delete({
        url: "api/platforms/"+this.stopPlatID+params,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Stopping platform")+" "+this.stopPlatID;
            this.snackbarSave = true;

            // Update context with success
            this.updateContext({
              view: 'platforms',
              action: 'stop_platform_success',
              platform: {
                platID: this.stopPlatID,
                gracefully: gracefully
              },
              notifToken: response.data.notifToken
            });

            if (response.data.notifToken) {
              this.scheduleLongOperCheck(response.data.notifToken,this.$t("Stopping platform")+" "+this.stopPlatID)
            }
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;

            // Update context with error
            this.updateContext({
              view: 'platforms',
              action: 'stop_platform_error',
              platform: {
                platID: this.stopPlatID,
                gracefully: gracefully
              },
              error: `Failed with status ${response.data.status}`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'platforms',
            action: 'stop_platform_error',
            platform: {
              platID: this.stopPlatID,
              gracefully: gracefully
            },
            error: `Error: ${error}`
          });
        })
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

      // Update context when preparing bulk action
      this.updateContext({
        view: 'platforms',
        action: 'prepare_bulk_action',
        bulkAction: {
          type: action,
          count: this.selectedPlatforms.length,
          platforms: this.selectedPlatforms.map(platform => ({
            platID: platform.platID,
            status: platform.status
          }))
        }
      });
    },

    actionDialogClick: function() {
      this.actionDialog = false;
      let action = this.selectedActionType;

      // Update context when performing bulk action
      this.updateContext({
        view: 'platforms',
        action: 'execute_bulk_action',
        bulkAction: {
          type: action,
          platforms: this.selectedPlatforms.map(platform => ({
            platID: platform.platID,
            status: platform.status
          }))
        }
      });

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
      // Update context when starting new platform
      this.updateContext({
        view: 'platforms',
        action: 'start_new_platform'
      });

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

        // Update context with error
        this.updateContext({
          view: 'platforms',
          action: 'start_new_platform_error',
          error: "Cannot find available platform"
        });
      }
    },

    start: async function(item,event) {
      if (event) {
        event.stopPropagation();
      }

      // Update context when starting platform
      this.updateContext({
        view: 'platforms',
        action: 'start_platform',
        platform: {
          platID: item.platID,
          status: item.status
        }
      });

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

          // Update context with success
          this.updateContext({
            view: 'platforms',
            action: 'start_platform_success',
            platform: {
              platID: item.platID
            },
            notifToken: response.data.notifToken
          });

          if (response.data.notifToken) {
            this.scheduleLongOperCheck(response.data.notifToken,this.$t("Starting platform")+" "+item.platID)
          }
        } else {
          console.log(`status: ${response.data.status}`);
          this.snackbarText = this.$t("Error");
          this.snackbarSave = true;

          // Update context with error
          this.updateContext({
            view: 'platforms',
            action: 'start_platform_error',
            platform: {
              platID: item.platID
            },
            error: `Failed with status ${response.data.status}`
          });
        }
      } catch (err) {
        console.log(`Error: ${err}`);
        this.snackbarText = this.$t("Error");
        this.snackbarSave = true;

        // Update context with error
        this.updateContext({
          view: 'platforms',
          action: 'start_platform_error',
          platform: {
            platID: item.platID
          },
          error: `Error: ${err}`
        });
      }
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

      // Update context when refreshing platforms
      this.updateContext({
        view: 'platforms',
        action: 'refresh_platforms',
        loading: true
      });

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

            // Update context with platforms data
            this.updateContext({
              view: 'platforms',
              action: 'platforms_loaded',
              loading: false,
              platformsData: {
                count: this.rows.length,
                running: this.rows.filter(platform => platform.status === 'running').length,
                available: this.rows.filter(platform => platform.status === 'available').length,
                disabled: this.rows.filter(platform => platform.status === 'not_available').length,
                error: this.rows.filter(platform => platform.status === 'error' || platform.status === 'revive').length,
                platforms: this.rows.map(platform => ({
                  platID: platform.platID,
                  status: platform.status,
                  sessions: platform.sessions,
                  availMem: platform.availMem,
                  cpuLoad: platform.cpuLoad,
                  ipAddress: platform.platform_ip
                }))
              },
              lastUpdated: new Date().toISOString()
            });

            setTimeout(this.refresh,5000);
          } else {
            console.log(`status: ${response.data.status}`);
            this.rows = [];

            // Update context with error
            this.updateContext({
              view: 'platforms',
              action: 'platforms_error',
              loading: false,
              error: `Failed to load platforms (status: ${response.data.status})`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'platforms',
            action: 'platforms_error',
            loading: false,
            error: `Error loading platforms: ${error}`
          });
        })
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

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'Platforms',
      permissions: {
        canManage: appData.checkPermission('@/','rw')
      },
      lastInitialized: new Date().toISOString()
    });

    this.refresh();
  },
  watch: {
    selectedPlatforms: function(newVal) {
      // Update context when platform selection changes
      this.updateContext({
        view: 'platforms',
        action: 'selection_changed',
        selectedPlatforms: newVal.map(platform => ({
          platID: platform.platID,
          status: platform.status
        })),
        selectedCount: newVal.length,
        canStart: this.canSelectedAction('start'),
        canStop: this.canSelectedAction('stop'),
        canEnable: this.canSelectedAction('enable'),
        canDisable: this.canSelectedAction('disable')
      });
    }
  }
};

export default page;
</script>