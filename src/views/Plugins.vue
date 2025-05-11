<template>
    <v-card color="bg">
      <v-card-title>{{ $t("Plugins") }}

      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="rows"
        :search="searchPlugins"
        :items-per-page="20"
        :loading="loading"
        :options.sync="options"
        @update:options="updateOptions"
        class="elevation-1 ma-4 bg"
        @click:row="rowClick"
      >
        <template v-slot:top>
          <v-toolbar flat color="bg">
            <v-btn
              color="primary"
              dark
              class="ma-2"
              @click="uploadDialog = true"
            >
              {{ $t("Upload New Plugin") }}
            </v-btn>
            <v-spacer></v-spacer>
       <v-text-field
          v-model="searchPlugins"
          append-icon="mdi-magnify"
          label="Search"
        ></v-text-field>
          </v-toolbar>
        </template>
        <template v-slot:[`item.status`]="{ item }">
            <v-chip color="green" v-if="item.status == 2">{{$t("Loaded")}}</v-chip>
            <v-chip color="red" v-else-if="item.status == 1">{{$t("Error")}}</v-chip>
            <v-chip v-else>{{$t("Not loaded")}}</v-chip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon v-if="item.active" small @click="disableEnableClick(item,$event)" class="mx-2"> mdi-cancel </v-icon>
          <v-icon v-if="!item.active" small @click="disableEnableClick(item,$event)" class="mx-2"> mdi-check </v-icon>
          <v-icon

            small
            @click="deletePlugin(item, $event)"
            class="mx-2"
          >
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
      <v-dialog v-model="dialog" persistent max-width="290" overlay-color="bg">
        <v-card>
          <v-card-title>
            {{ $t("Delete deleteAppName", { deletePluginName }) }}
          </v-card-title>
          <v-card-text>
            {{ $t("Are you sure you want to delete", { deletePluginName }) }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="warning" @click="dialog = false"> Cancel </v-btn>
            <v-btn color="primary" @click="deleteOK"> OK </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog
        v-model="uploadDialog"
        persistent
        max-width="1000"
        overlay-color="bg"
      >
        <v-card color="bg">
          <v-card-title>
            {{ $t("Upload New Plugin") }}
          </v-card-title>
          <v-container class="ma-4">
            <v-form ref="uploadForm">
            <v-row class="mx-4">
              <v-col>
                <v-file-input
                  v-model="filename"
                  show-size
                  :accept="'.tgz'"
                  :label="$t('Plugin Package')"
                  @change="selectFile"
                  :rules="fileRules"
                ></v-file-input>
              </v-col>
            </v-row>
            <v-row class="mx-4">
              <v-col>
                <v-alert
                  :type="uploadPluginDesc.uploadAlertType"
                  text
                  v-if="
                    uploadPluginDesc.uploadStatus && uploadPluginDesc.uploadStatus != ''
                  "
                >
                  {{ uploadPluginDesc.uploadStatus }}
                  <v-progress-linear
                    v-if="uploadProgress > 0"
                    v-model="uploadProgress"
                  ></v-progress-linear>
                  <!-- <v-btn
                    v-if="uploadPluginDesc.uploadAlertType == 'success'"
                    class="ma-2"
                    color="success"
                    @click="goToUploadedPlugin"
                  >
                    {{ $t("Go to Plugin") }}
                  </v-btn> -->
                </v-alert>
              </v-col>
            </v-row>
            </v-form>
          </v-container>
          <v-card-actions class="mx-4">
            <v-spacer></v-spacer>
            <v-btn color="warning"
              v-if="uploadProgress  < 100"
              @click="closeUpload">
              {{ $t("Cancel") }}
            </v-btn>
            <v-btn
              v-if="uploadProgress  == 100"
              color="primary" @click="closeUpload">
              {{ $t("Close") }}
            </v-btn>
            <v-btn
              v-if="uploadProgress  < 100"
              color="primary"
              :loading="uploading"
              :disabled="(!uploadSelectedFile && !aptPackage ) || uploading || !uploadValid"
              @click="startUpload"
            >
              {{ $t("Upload") }}
              <v-icon right dark> mdi-cloud-upload </v-icon>
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

  let page = {
    name: "Apps",
    data: () => ({
      headers: [],
      rows: [],
      searchPlugins: "",
      search: "",
      totalItems: 0,
      loading: true,
      options: {},
      dialog: false,
      deleteObj: null,
      deletePluginName: "",
      snackbarSave: false,
      snackbarText: "",
      filename: null,
      uploadDialog: false,
      uploading: false,
      uploadProgress: 0,
      uploadFileName: "",
      uploadSelectedFile: null,
      uploadValid: false,
      uploadPluginDesc: {},
      webappDialog: false,
      appTypes: [],
      appType: "apk",
      aptPackage: "",
      aptPackagesLoading: false,
      aptPackages: [],
      fileRules: [],
      iconURL: "",
      rebuildImage: true,
      httpRules: [
        (v) => !!v || "URL is required",
        (v) =>
          /[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/.test(
            v
          ) || "URL must be valid",
      ],
      appData,
      pageContext: {}, // Store context data for the Plugins page
    }),
    methods: {
      // Add updateContext method to maintain context within the Plugins page
      updateContext: function(contextData) {
        // Preserve existing page context while adding new data
        this.pageContext = {
          ...this.pageContext,
          ...contextData
        };

        // Always include the full pageContext when updating app state
        this.$emit('updateAppState', {
          componentName: this.$options.name || 'Plugins',
          timestamp: new Date().toISOString(),
          ...this.pageContext
        });
      },

      savePage: function () {
        appUtils.savePageData(`${page.name}`,this,['options','searchPlugins']);
      },

      updateOptions() {
        this.savePage();

        // Update context when options change
        this.updateContext({
          view: 'plugins',
          action: 'update_options',
          options: this.options
        });
      },

      rowClick: function (val) {
        console.log(`rowClick: ${val.id}`);

        // Update context when clicking on a plugin
        this.updateContext({
          view: 'plugins',
          action: 'select_plugin',
          selectedPlugin: {
            id: val.id,
            name: val.name,
            version: val.version,
            description: val.description,
            active: val.active,
            status: val.status
          }
        });

        this.$router.push("/Plugin/" + val.id);
      },

      disableEnableClick: function (val, event) {
        event.stopPropagation();
        console.log(`disableClick: ${val.id}`);
        this.savePage();

        // Update context when enabling/disabling a plugin
        this.updateContext({
          view: 'plugins',
          action: val.active ? 'disable_plugin' : 'enable_plugin',
          plugin: {
            id: val.id,
            name: val.name,
            active: val.active
          }
        });

        appUtils
          .post({
            url: "api/plugins/" + encodeURIComponent(val.id),
            data: {
              active: !val.active,
            },
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
              this.snackbarText = this.$t("Saved");
              this.snackbarSave = true;

              // Update context with success
              this.updateContext({
                view: 'plugins',
                action: val.active ? 'disable_plugin_success' : 'enable_plugin_success',
                plugin: {
                  id: val.id,
                  name: val.name,
                  active: !val.active
                }
              });

              this.refresh();
            } else {
              this.snackbarText = this.$t("Error");
              this.snackbarSave = true;

              // Update context with error
              this.updateContext({
                view: 'plugins',
                action: val.active ? 'disable_plugin_error' : 'enable_plugin_error',
                plugin: {
                  id: val.id,
                  name: val.name
                },
                error: `Failed with status ${response.data.status}`
              });
            }
          })
          .catch((error) => {
            console.log(error);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;

            // Update context with error
            this.updateContext({
              view: 'plugins',
              action: val.active ? 'disable_plugin_error' : 'enable_plugin_error',
              plugin: {
                id: val.id,
                name: val.name
              },
              error: `Error: ${error}`
            });
          });
      },

      deletePlugin: function (val, event) {
        event.stopPropagation();
        this.deleteObj = val;
        this.deletePluginName = val.name;
        this.dialog = true;

        // Update context when preparing to delete a plugin
        this.updateContext({
          view: 'plugins',
          action: 'prepare_delete_plugin',
          plugin: {
            id: val.id,
            name: val.name,
            version: val.version
          }
        });
      },

      deleteOK: function () {
        console.log(`deletePlugin: ${this.deletePluginName}`);
        this.dialog = false;
        this.savePage();

        // Update context when confirming plugin deletion
        this.updateContext({
          view: 'plugins',
          action: 'delete_plugin',
          plugin: {
            id: this.deleteObj.id,
            name: this.deleteObj.name
          }
        });

        appUtils
          .delete({
            url: "api/plugins/" + encodeURIComponent(this.deleteObj.id),
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
              this.snackbarText = this.$t("Deleted");
              this.snackbarSave = true;

              // Update context with success
              this.updateContext({
                view: 'plugins',
                action: 'delete_plugin_success',
                plugin: {
                  id: this.deleteObj.id,
                  name: this.deleteObj.name
                }
              });

              this.refresh();
            } else {
              console.log(`status: ${response.data.status}`);
              this.snackbarText =
                this.$t("Error") + " - " + response.data.message;
              this.snackbarSave = true;

              // Update context with error
              this.updateContext({
                view: 'plugins',
                action: 'delete_plugin_error',
                plugin: {
                  id: this.deleteObj.id,
                  name: this.deleteObj.name
                },
                error: response.data.message
              });
            }
          })
          .catch((error) => {
            console.log(error);

            // Update context with error
            this.updateContext({
              view: 'plugins',
              action: 'delete_plugin_error',
              plugin: {
                id: this.deleteObj.id,
                name: this.deleteObj.name
              },
              error: `Error: ${error}`
            });
          })
          .finally(() => (this.loading = false));
      },

      selectFile: function (file) {
        console.log("selectFile: " + file);
        this.uploadSelectedFile = file;

        // Update context when selecting a file for upload
        this.updateContext({
          view: 'plugins',
          action: 'select_plugin_file',
          fileDetails: file ? {
            name: file.name,
            size: file.size,
            type: file.type
          } : null
        });
      },

      closeUpload: function(){
        this.uploadDialog = false;
        this.uploading = false;
        this.uploadProgress = 0;
        this.uploadFileName = "";
        this.uploadSelectedFile = "";
        this.uploadPluginDesc = {};

        // Update context when closing the upload dialog
        this.updateContext({
          view: 'plugins',
          action: 'close_upload_dialog'
        });
      },

      startUpload: function () {
        this.uploading = true;
        let formData = new FormData();
        formData.append("file", this.uploadSelectedFile);
        this.uploadPluginDesc.uploadAlertType = "info";
        this.uploadPluginDesc.uploadStatus = this.$t("Uploading file..");
        let thisPage = this;
        this.savePage();

        // Update context when starting upload
        this.updateContext({
          view: 'plugins',
          action: 'start_plugin_upload',
          fileDetails: this.uploadSelectedFile ? {
            name: this.uploadSelectedFile.name,
            size: this.uploadSelectedFile.size,
            type: this.uploadSelectedFile.type
          } : null
        });

        appUtils
          .put({
            url: "api/plugins",
            data: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 600000,
            onUploadProgress: function (progressEvent) {
              var percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(percentCompleted);
              thisPage.uploadProgress = Math.round(percentCompleted / 2);

              // Update context with upload progress
              thisPage.updateContext({
                view: 'plugins',
                action: 'plugin_upload_progress',
                progress: thisPage.uploadProgress
              });
            },
          })
          .then((response) => {
            console.log(response.data);
            this.uploadSelectedFile = null;
            if (response.data.status == 1) {
              console.log(`status: ${response.data.status}`);
              this.uploadPluginDesc.uploadStatus = this.$t(
                  "The plugin was installed successfully"
                );
                this.uploadPluginDesc.uploadAlertType = "success";
                this.uploadProgress = 100;

                // Update context with upload success
                this.updateContext({
                  view: 'plugins',
                  action: 'plugin_upload_success',
                  plugin: response.data.plugin || {
                    name: response.data.name,
                    id: response.data.id
                  }
                });

                this.refresh();
            } else {
              console.log(`status: ${response.data.status}`);
              this.uploading = false;
              this.uploadPluginDesc.uploadStatus =
                this.$t("Error uploading plugin") + " - " + response.data.message;
              this.uploadPluginDesc.uploadAlertType = "error";

              // Update context with upload error
              this.updateContext({
                view: 'plugins',
                action: 'plugin_upload_error',
                error: response.data.message
              });
            }
          })
          .catch((error) => {
            this.uploadSelectedFile = null;
            this.uploading = false;
            this.uploadPluginDesc.uploadStatus =
              this.$t("Error uploading plugin") + " - " + error;
            this.uploadPluginDesc.uploadAlertType = "error";

            // Update context with upload error
            this.updateContext({
              view: 'plugins',
              action: 'plugin_upload_error',
              error: `Error: ${error}`
            });
          })
          .finally(() => (this.loading = false));
      },

      goToUploadedPlugin: function () {
        this.$router.push("/Plugin/" + this.uploadPluginDesc.packageName);
      },

      checkUploadStatus: function () {
        let thisPage = this;

        // Update context when checking upload status
        this.updateContext({
          view: 'plugins',
          action: 'check_upload_status',
          packageName: this.uploadPluginDesc.packageName
        });

        appUtils
          .get({
            url:
              "api/apps/" +
              encodeURIComponent(this.uploadPluginDesc.packageName) +
              "/checkUploadStatus",
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
              console.log(`status: ${response.data.status}`);
              let apkStatus = response.data.apkStatus;
              if (apkStatus > 0) {
                if (apkStatus == 1) {
                  this.uploadPluginDesc.uploadStatus = this.$t("Processing apk..");
                  this.uploadProgress = 70;
                } else {
                  this.uploadPluginDesc.uploadStatus = this.$t("Installing app..");
                  this.uploadProgress = 90;
                }
                this.uploadPluginDesc.uploadAlertType = "info";

                // Update context with processing status
                this.updateContext({
                  view: 'plugins',
                  action: 'upload_processing',
                  progress: this.uploadProgress,
                  status: this.uploadPluginDesc.uploadStatus
                });

                setTimeout(function () {
                  thisPage.checkUploadStatus();
                }, 1000);
              } else {
                if (apkStatus == 0) {
                  this.uploadPluginDesc.uploadStatus = this.$t(
                    "The apk was installed successfully"
                  );
                  this.uploadPluginDesc.uploadAlertType = "success";

                  // Update context with success
                  this.updateContext({
                    view: 'plugins',
                    action: 'upload_completed',
                    packageName: this.uploadPluginDesc.packageName
                  });

                  this.refresh();
                } else {
                  this.uploadPluginDesc.uploadStatus = this.$t(
                    "Error installing apk"
                  );
                  this.uploadPluginDesc.uploadAlertType = "error";

                  // Update context with error
                  this.updateContext({
                    view: 'plugins',
                    action: 'upload_error',
                    error: "Error installing apk"
                  });
                }
                this.uploadProgress = 0;
                this.uploading = false;
              }
            } else {
              console.log(`status: ${response.data.status}`);
              this.uploadPluginDesc.uploadStatus =
                this.$t("Error installing apk") + " - " + response.data.status;
              this.uploadPluginDesc.uploadAlertType = "error";
              this.uploading = false;

              // Update context with error
              this.updateContext({
                view: 'plugins',
                action: 'upload_status_error',
                error: `Failed with status ${response.data.status}`
              });
            }
          })
          .catch((error) => {
            this.uploadPluginDesc.uploadStatus =
              this.$t("Error installing apk") + " - " + error;
            this.uploadPluginDesc.uploadAlertType = "error";
            this.uploading = false;

            // Update context with error
            this.updateContext({
              view: 'plugins',
              action: 'upload_status_error',
              error: `Error: ${error}`
            });
          })
          .finally(() => (this.loading = false));
      },

      refresh: function () {
        // Update context when refreshing plugins
        this.updateContext({
          view: 'plugins',
          action: 'refresh_plugins',
          loading: true
        });

        appUtils
          .get({
            url: "api/plugins",
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
              this.rows = response.data.results;

              // Update context with plugins data
              this.updateContext({
                view: 'plugins',
                action: 'plugins_loaded',
                loading: false,
                pluginsData: {
                  count: this.rows.length,
                  active: this.rows.filter(plugin => plugin.active).length,
                  inactive: this.rows.filter(plugin => !plugin.active).length,
                  loaded: this.rows.filter(plugin => plugin.status === 2).length,
                  error: this.rows.filter(plugin => plugin.status === 1).length,
                  notLoaded: this.rows.filter(plugin => plugin.status === 0).length,
                  plugins: this.rows.map(plugin => ({
                    id: plugin.id,
                    name: plugin.name,
                    version: plugin.version,
                    description: plugin.description,
                    active: plugin.active,
                    status: plugin.status
                  }))
                },
                lastUpdated: new Date().toISOString()
              });
            } else {
              console.log(`status: ${response.data.status}`);
              this.rows = [];

              // Update context with error
              this.updateContext({
                view: 'plugins',
                action: 'plugins_error',
                loading: false,
                error: `Failed to load plugins (status: ${response.data.status})`
              });
            }
          })
          .catch((error) => {
            console.log(error);

            // Update context with error
            this.updateContext({
              view: 'plugins',
              action: 'plugins_error',
              loading: false,
              error: `Error loading plugins: ${error}`
            });
          })
          .finally(() => (this.loading = false));
      },
    },
    watch: {
      uploadSelectedFile() {
        this.uploadValid = this.$refs.uploadForm.validate();
      },
      searchPlugins() {
        this.savePage();

        // Update context when search term changes
        this.updateContext({
          view: 'plugins',
          action: 'search_plugins',
          searchTerm: this.searchPlugins
        });
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
          text: this.$t("Plugins"),
          to: "/Plugins",
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
      this.headers = [
        { text: this.$t("ID"), value: "id" },
        { text: this.$t("Name"), value: "name" },
        { text: this.$t("Version"), value: "version" },
        { text: this.$t("Description"), value: "description" },
        { text: this.$t("Active"), value: "active" },
        { text: this.$t("Status"), value: "status" },
        { text: "Actions", value: "actions", sortable: false },
      ];

      this.fileRules = [
        () => {
          return true;
        }
      ];

      // Initialize context when component is created
      this.updateContext({
        view: 'init',
        pageType: 'Plugins',
        permissions: {
          canManage: appData.checkPermission('@/','rw')
        },
        lastInitialized: new Date().toISOString()
      });

      appUtils.loadPageData(page.name,this);
      this.refresh();
    },
  };

  export default page;
  </script>