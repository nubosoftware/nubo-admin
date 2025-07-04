<template>
  <v-card color="bg">
    <v-card-title>{{ $t("Apps") }}

    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :search="searchApps"
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
            v-if="appData.checkPermission('/apps', 'w')"
            color="primary"
            dark
            class="ma-2"
            @click="uploadDialog = true"
          >
            {{ $t("App Upload") }}
          </v-btn>
          <v-btn
            v-if="appData.isMobile() && appData.checkPermission('/apps', 'w')"
            color="primary"
            dark
            class="ma-2"
            @click="webappDialog = true"
          >
            {{ $t("Generate Web App") }}
          </v-btn>
          <v-spacer></v-spacer>
     <v-text-field
        v-model="searchApps"
        append-icon="mdi-magnify"
        label="Search"
      ></v-text-field>
        </v-toolbar>
      </template>
      <template v-slot:[`item.imageUrl`]="{ item }">
        <v-img max-height="40" max-width="40" :src="item.imageUrl"></v-img>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon
          v-if="appData.checkPermission('/apps', 'w')"
          small
          @click="deleteApp(item, $event)"
          class="mx-2"
        >
          mdi-delete
        </v-icon>
      </template>
    </v-data-table>
    <v-dialog v-model="dialog" persistent max-width="290" overlay-color="bg">
      <v-card>
        <v-card-title>
          {{ $t("Delete deleteAppName", { deleteAppName }) }}
        </v-card-title>
        <v-card-text>
          {{ $t("Are you sure you want to delete", { deleteAppName }) }}
        </v-card-text>
        <v-card-text>
          <v-checkbox
                    v-model="rebuildImage"
                    column
                    class="mx-4 my-0"
                    :label="$t('Rebuild platform image after delete')"
                  ></v-checkbox>
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
          {{ $t("Upload App") }}
        </v-card-title>
        <v-container class="ma-4">
          <v-form ref="uploadForm">
          <v-row class="mx-4">
            <v-col>
              <v-select
                class="ma-4"
                :items="appTypes"
                :label="$t('App Type')"
                v-model="appType"
              ></v-select>
            </v-col>
          </v-row>
          <v-row v-if="appType == 'deb'" class="mx-4">
            <v-col>

              <v-autocomplete
                clearable
                v-model="aptPackage"
                :items="aptPackages"
                :loading="aptPackagesLoading"
                :search-input.sync="search"
                :rules="fileRules"
                hide-no-data
                hide-selected
                item-text="desc"
                item-value="package"
                :label="$t('APT Package Name')"
                :placeholder="$t('Start typing to Search')"
                prepend-icon="mdi-database-search"

              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row  v-if="appType == 'apk'" class="mx-4">
            <v-col>
              <v-checkbox
                    v-model="rebuildImage"
                    column
                    class="mx-4 my-0"
                    :label="$t('Rebuild platform image after upload')"
                  ></v-checkbox>
            </v-col>
          </v-row>
          <v-row class="mx-4">
            <v-col>
              <v-file-input
                v-model="filename"
                show-size
                :accept="appType == 'apk' ? '.apk' : '.deb'"
                :label="appType == 'apk' ? $t('APK File') : $t('DEB File')"
                @change="selectFile"
                :rules="fileRules"
              ></v-file-input>
            </v-col>
          </v-row>

          <v-row
            v-if="uploadAppDesc.appName && uploadAppDesc.appName != ''"
            class="mx-4"
          >
            <v-col>
              <v-text-field
                :label="$t('App Name')"
                readonly
                v-model="uploadAppDesc.appName"
              />
            </v-col>
            <v-col>
              <v-text-field
                :label="$t('Package Name')"
                readonly
                v-model="uploadAppDesc.packageName"
              />
            </v-col>
          </v-row>
          <v-row
            v-if="uploadAppDesc.appName && uploadAppDesc.appName != ''"
            class="mx-4"
          >
            <v-col>
              <v-text-field
                :label="$t('Version Name')"
                v-model="uploadAppDesc.versionName"
                readonly
              />
            </v-col>
            <v-col>
              <v-text-field
                :label="$t('Version Code')"
                v-model="uploadAppDesc.versionCode"
                readonly
              />
            </v-col>
          </v-row>
          <v-row class="mx-4">
            <v-col>
              <v-alert
                :type="uploadAppDesc.uploadAlertType"
                text
                v-if="
                  uploadAppDesc.uploadStatus && uploadAppDesc.uploadStatus != ''
                "
              >
                {{ uploadAppDesc.uploadStatus }}
                <v-progress-linear
                  v-if="uploadProgress > 0"
                  v-model="uploadProgress"
                ></v-progress-linear>
                <v-btn
                  v-if="uploadAppDesc.uploadAlertType == 'success'"
                  class="ma-2"
                  color="success"
                  @click="goToUploadedApp"
                >
                  {{ $t("Go to App") }}
                </v-btn>
              </v-alert>
            </v-col>
          </v-row>
          </v-form>
        </v-container>
        <v-card-actions class="mx-4">
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="uploadDialog = false">
            {{ $t("Cancel") }}
          </v-btn>
          <v-btn
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

    <v-dialog
      v-model="webappDialog"
      persistent
      max-width="1000"
      overlay-color="bg"
    >
      <v-card color="bg">
        <v-card-title>
          {{ $t("Generate Web App") }}
        </v-card-title>
        <v-container class="ma-4">
          <v-row class="mx-4">
            <v-col>
              <v-text-field
                :label="$t('URL')"
                placeholder="https://youwebsite.com"
                :rules="httpRules"
                v-model="uploadAppDesc.appURL"
              />
            </v-col>
          </v-row>
          <v-row class="mx-4">
            <v-col cols="6">
              <v-text-field
                :label="$t('App Name')"
                v-model="uploadAppDesc.appName"
              />
            </v-col>
            <v-col cols="1">
              <v-img height="50" width="50" :src="iconURL"> </v-img>
            </v-col>
            <v-col cols="5">
              <v-file-input
                show-size
                accept=".png"
                :label="$t('App Icon')"
                @change="selectIcon"
              ></v-file-input>
            </v-col>
          </v-row>

          <v-row class="mx-4">
            <v-col>
              <v-alert
                :type="uploadAppDesc.uploadAlertType"
                text
                v-if="
                  uploadAppDesc.uploadStatus && uploadAppDesc.uploadStatus != ''
                "
              >
                {{ uploadAppDesc.uploadStatus }}
                <v-progress-linear
                  v-if="uploadProgress > 0"
                  v-model="uploadProgress"
                ></v-progress-linear>
                <v-btn
                  v-if="uploadAppDesc.uploadAlertType == 'success'"
                  class="ma-2"
                  color="success"
                  @click="goToUploadedApp"
                >
                  {{ $t("Go to App") }}
                </v-btn>
              </v-alert>
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions class="mx-4">
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="webappDialog = false">
            {{ $t("Cancel") }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="uploading"
            :disabled="
              !uploadAppDesc.appURL ||
              uploadAppDesc.appURL == '' ||
              !uploadAppDesc.appName ||
              uploadAppDesc.appName == '' ||
              iconURL == '' ||
              uploading
            "
            @click="startWebapp"
          >
            {{ $t("Generate App") }}
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
import contextUpdater from "../mixins/contextUpdater";

let page = {
  name: "Apps",
  mixins: [contextUpdater],
  data: () => ({
    headers: [],
    rows: [],
    searchApps: "",
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialog: false,
    deleteObj: null,
    deleteAppName: "",
    snackbarSave: false,
    snackbarText: "",
    filename: null,
    uploadDialog: false,
    uploading: false,
    uploadProgress: 0,
    uploadFileName: "",
    uploadSelectedFile: null,
    uploadValid: false,
    uploadAppDesc: {},
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
  }),
  methods: {
    savePage: function () {
      appUtils.savePageData(`${page.name}`,this,['options','searchApps','rebuildImage']);

      // Update context with current page state
      this.updateContext({
        view: 'list',
        searchFilter: this.searchApps,
        sortOptions: this.options,
        totalApps: this.rows.length
      });
    },
    updateOptions() {
      this.savePage();
    },
    rowClick: function (val) {
      console.log(`rowClick: ${val.packageName}`);
      // Update context before navigation
      this.updateContext({
        view: 'selectingApp',
        selectedApp: val
      });
      this.$router.push("/App/" + val.packageName);
    },
    deleteApp: function (val, event) {
      event.stopPropagation();
      this.deleteObj = val;
      this.deleteAppName = val.appName;
      this.dialog = true;

      // Update context when deletion dialog is opened
      this.updateContext({
        view: 'deletingApp',
        appToDelete: val
      });
    },
    deleteOK: function () {
      console.log(`deleteApp: ${this.deleteAppName}`);
      this.dialog = false;
      this.savePage();
      appUtils
        .delete({
          url: "api/apps/" + encodeURIComponent(this.deleteObj.packageName),
          data: {
            rebuildImage: this.rebuildImage
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Deleted");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText =
              this.$t("Error") + " - " + response.data.message;
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    selectFile: function (file) {
      console.log("selectFile: " + file);
      this.uploadSelectedFile = file;

      // Update context with file selection
      if (file) {
        this.updateContext({
          view: 'uploadingApp',
          uploadStage: 'fileSelected',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
      }
    },
    startUpload: function () {
      this.uploading = true;
      let formData = new FormData();
      formData.append("file", this.uploadSelectedFile);
      this.uploadAppDesc.uploadAlertType = "info";
      this.uploadAppDesc.uploadStatus = this.$t("Uploading file..");
      let thisPage = this;
      this.savePage();

      // Update context with upload start
      this.updateContext({
        view: 'uploadingApp',
        uploadStage: 'uploadStarted',
        appType: this.appType,
        aptPackage: this.aptPackage || null,
        fileName: this.uploadSelectedFile ? this.uploadSelectedFile.name : null,
        status: this.uploadAppDesc.uploadStatus,
        rebuildImage: this.rebuildImage
      });

      appUtils
        .post({
          url: "api/upload",
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
            if (percentCompleted % 20 === 0) { // Update only on significant changes (every 20%)
              thisPage.updateContext({
                view: 'uploadingApp',
                uploadStage: 'uploading',
                progress: percentCompleted,
                status: thisPage.uploadAppDesc.uploadStatus
              });
            }
          },
        })
        .then((response) => {
          console.log(response.data);
          this.uploadSelectedFile = null;
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.uploadFileName = response.data.uploadFileName;
            this.uploadAPK();
          } else {
            console.log(`status: ${response.data.status}`);
            this.uploading = false;
            this.uploadAppDesc.uploadStatus =
              this.$t("Error uploading apk") + " - " + response.data.message;
            this.uploadAppDesc.uploadAlertType = "error";
          }
        })
        .catch((error) => {
          this.uploadSelectedFile = null;
          this.uploading = false;
          this.uploadAppDesc.uploadStatus =
            this.$t("Error uploading apk") + " - " + error;
          this.uploadAppDesc.uploadAlertType = "error";
        })
        .finally(() => (this.loading = false));
    },
    uploadAPK: function () {
      console.log("uploadAPK: " + this.uploadFileName);

      // Update context with APK upload initiation
      this.updateContext({
        view: 'uploadingApp',
        uploadStage: 'startingInstallation',
        fileName: this.uploadFileName,
        packageName: this.aptPackage,
        appType: this.appType,
        rebuildImage: this.rebuildImage
      });

      appUtils
        .put({
          url: "api/apps",
          data: {
            fileName: this.uploadFileName,
            packageName: this.aptPackage,
            appType: this.appType,
            rebuildImage: this.rebuildImage
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);

            this.uploadAppDesc = response.data;
            this.uploadAppDesc.uploadAlertType = "info";
            this.uploadAppDesc.uploadStatus = this.$t("Installing apk..");
            this.uploadProgress = 60;

            // Update context with installation progress
            this.updateContext({
              view: 'uploadingApp',
              uploadStage: 'installing',
              progress: 60,
              appDetails: this.uploadAppDesc,
              status: this.uploadAppDesc.uploadStatus
            });

            this.checkUploadStatus();
          } else {
            console.log(`status: ${response.data.status}`);
            this.uploadAppDesc.uploadStatus =
              this.$t("Error installing apk") + " - " + response.data.message;
            this.uploadAppDesc.uploadAlertType = "error";
            this.uploading = false;

            // Update context with error
            this.updateContext({
              view: 'uploadingApp',
              uploadStage: 'error',
              error: response.data.message,
              status: this.uploadAppDesc.uploadStatus
            });
          }
        })
        .catch((error) => {
          this.uploadAppDesc.uploadStatus =
            this.$t("Error installing apk") + " - " + error;
          this.uploadAppDesc.uploadAlertType = "error";
          this.uploading = false;

          // Update context with error
          this.updateContext({
            view: 'uploadingApp',
            uploadStage: 'error',
            error: error.toString(),
            status: this.uploadAppDesc.uploadStatus
          });
        })
        .finally(() => (this.loading = false));
    },
    goToUploadedApp: function () {
      // Update context before navigation
      this.updateContext({
        view: 'uploadingApp',
        uploadStage: 'complete',
        navigatingTo: this.uploadAppDesc.packageName
      });

      this.$router.push("/App/" + this.uploadAppDesc.packageName);
    },
    checkUploadStatus: function () {
      let thisPage = this;
      appUtils
        .get({
          url:
            "api/apps/" +
            encodeURIComponent(this.uploadAppDesc.packageName) +
            "/checkUploadStatus",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            //this.uploading = false;
            /*
            apkStatus: 1
            message: ""
            status: "1"
            */
            let apkStatus = response.data.apkStatus;
            let statusText = '';

            if (apkStatus > 0) {
              if (apkStatus == 1) {
                this.uploadAppDesc.uploadStatus = this.$t("Processing apk..");
                this.uploadProgress = 70;
                statusText = 'processing';
              } else {
                this.uploadAppDesc.uploadStatus = this.$t("Installing app..");
                this.uploadProgress = 90;
                statusText = 'installing';
              }
              this.uploadAppDesc.uploadAlertType = "info";

              // Update context with current status
              this.updateContext({
                view: 'uploadingApp',
                uploadStage: statusText,
                progress: this.uploadProgress,
                apkStatus: apkStatus,
                status: this.uploadAppDesc.uploadStatus
              });

              setTimeout(function () {
                thisPage.checkUploadStatus();
              }, 1000);
            } else {
              if (apkStatus == 0) {
                this.uploadAppDesc.uploadStatus = this.$t(
                  "The apk was installed successfully"
                );
                this.uploadAppDesc.uploadAlertType = "success";
                statusText = 'success';
                this.refresh();
              } else {
                this.uploadAppDesc.uploadStatus = this.$t(
                  "Error installing apk"
                );
                this.uploadAppDesc.uploadAlertType = "error";
                statusText = 'error';
              }
              this.uploadProgress = 0;
              this.uploading = false;

              // Update context with final status
              this.updateContext({
                view: 'uploadingApp',
                uploadStage: statusText,
                appDetails: this.uploadAppDesc,
                apkStatus: apkStatus,
                status: this.uploadAppDesc.uploadStatus
              });
            }
          } else {
            console.log(`status: ${response.data.status}`);
            this.uploadAppDesc.uploadStatus =
              this.$t("Error installing apk") + " - " + response.data.message;
            this.uploadAppDesc.uploadAlertType = "error";
            this.uploading = false;
          }
        })
        .catch((error) => {
          this.uploadAppDesc.uploadStatus =
            this.$t("Error installing apk") + " - " + error;
          this.uploadAppDesc.uploadAlertType = "error";
          this.uploading = false;
        })
        .finally(() => (this.loading = false));
    },
    refresh: function () {
      appUtils
        .get({
          url: "api/apps",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.apps;

            // Update context with fetched apps data
            this.updateContext({
              view: 'list',
              searchFilter: this.searchApps,
              sortOptions: this.options,
              apps: this.rows,
              totalApps: this.rows.length,
              lastFetched: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);
            this.rows = [];

            // Update context with empty apps list and error
            this.updateContext({
              view: 'list',
              searchFilter: this.searchApps,
              error: `Error fetching apps (status: ${response.data.status})`,
              apps: [],
              totalApps: 0,
              lastFetched: new Date().toISOString()
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error information
          this.updateContext({
            view: 'list',
            error: `Error fetching apps: ${error}`,
            lastFetched: new Date().toISOString()
          });
        })
        .finally(() => (this.loading = false));
    },
    selectIcon: function (file) {
      console.log(file);
      let thisPage = this;
      if (!file) {
        thisPage.iconURL = "";
        return;
      }
      let reader = new FileReader();
      reader.onload = function () {
        var dataURL = reader.result;
        //var output = document.getElementById('output');
        //output.src = dataURL;
        console.log("dataURL: " + dataURL);
        thisPage.iconURL = dataURL;
      };
      reader.readAsDataURL(file);
    },
    startWebapp: function () {
      this.uploading = true;
      console.log("startWebapp");
      this.uploadAppDesc.uploadAlertType = "info";
      this.uploadAppDesc.uploadStatus = this.$t(
        "Sending web app information.."
      );
      this.uploadProgress = 1;
      let arr = this.iconURL.split(",");
      let icLauncher = arr[1];
      console.log("arr.length: " + arr.length);
      appUtils
        .put({
          url: "api/apps/webapp",
          data: {
            appURL: this.uploadAppDesc.appURL,
            appName: this.uploadAppDesc.appName,
            ssoURL: this.uploadAppDesc.appURL,
            OrientationMode: "0",
            icLauncher: icLauncher,
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.uploadAppDesc.packageName = response.data.apkname;
            this.uploadAppDesc.uploadAlertType = "info";
            this.uploadAppDesc.uploadStatus = this.$t("Building web app..");
            this.uploadProgress = 10;
            this.checkWebappStatus();
          } else {
            console.log(`status: ${response.data.status}`);
            this.uploadAppDesc.uploadStatus =
              this.$t("Error building web app") + " - " + response.data.message;
            this.uploadAppDesc.uploadAlertType = "error";
            this.uploading = false;
          }
        })
        .catch((error) => {
          this.uploadAppDesc.uploadStatus =
            this.$t("Error building web app") + " - " + error;
          this.uploadAppDesc.uploadAlertType = "error";
          this.uploading = false;
        })
        .finally(() => (this.loading = false));
    },
    checkWebappStatus: function () {
      let thisPage = this;
      appUtils
        .get({
          url:
            "api/apps/webapp?appURL=" +
            encodeURIComponent(this.uploadAppDesc.appURL),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.uploadAppDesc.uploadAlertType = "info";

            let isError = true;
            let isComplete = false;
            if (response.data.URLLauncherStatus == 1) {
              isError = false;
              isComplete = true;
              this.uploadAppDesc.uploadStatus = this.$t(
                "Web app was genereated successfully"
              );
            } else if (response.data.URLLauncherStatus == 2) {
              isError = false;
              this.uploadAppDesc.uploadStatus = this.$t("Building web app...");
              this.uploadProgress = 20;
            } else if (response.data.URLLauncherStatus == 4) {
              isError = false;
              this.uploadAppDesc.uploadStatus = this.$t(
                "Installing web app..."
              );
              this.uploadProgress = 60;
            } else if (response.data.URLLauncherStatus == 3) {
              isError = true;
              isComplete = true;
              this.uploadAppDesc.uploadStatus = this.$t("Build error");
            } else if (response.data.URLLauncherStatus == 5) {
              isError = true;
              isComplete = true;
              this.uploadAppDesc.uploadStatus = this.$t("Install error");
            } else {
              isError = true;
              isComplete = true;
              this.uploadAppDesc.uploadStatus = this.$t(
                "Unknown status: " + this.uploadAppDesc.uploadStatus
              );
            }
            if (isError) {
              this.uploadAppDesc.uploadAlertType = "error";
              this.uploadProgress = 0;
            } else if (!isComplete) {
              this.uploadAppDesc.uploadAlertType = "info";
            } else {
              this.uploadAppDesc.uploadAlertType = "success";
              this.uploadProgress = 0;
            }
            this.$forceUpdate();
            if (isComplete) {
              this.uploading = false;
            } else {
              setTimeout(function () {
                thisPage.checkWebappStatus();
              }, 1000);
            }
          } else {
            console.log(`status: ${response.data.status}`);
            this.uploadAppDesc.uploadStatus =
              this.$t("Error building web app") + " - " + response.data.message;
            this.uploadAppDesc.uploadAlertType = "error";
            this.uploading = false;
          }
        })
        .catch((error) => {
          this.uploadAppDesc.uploadStatus =
            this.$t("Error building web app") + " - " + error;
          this.uploadAppDesc.uploadAlertType = "error";
          this.uploading = false;
        })
        .finally(() => (this.loading = false));
    },
  },
  watch: {
      aptPackage(val) {
        console.log(`aptPackage: ${val}`);
        this.uploadValid =  this.$refs.uploadForm.validate();
      },
      uploadSelectedFile() {
        this.uploadValid = this.$refs.uploadForm.validate();
      },
      searchApps() {
        this.savePage();

        // Update context when search filter changes
        this.updateContext({
          view: 'list',
          searchFilter: this.searchApps,
          filteredApps: this.rows.filter(app => {
            if (!this.searchApps) return true;
            const searchTerm = this.searchApps.toLowerCase();
            return app.appName.toLowerCase().includes(searchTerm) ||
                   app.packageName.toLowerCase().includes(searchTerm);
          }).length,
          totalApps: this.rows.length
        });
      },
      appType() {
        this.aptPackage = "";
        this.filename = null;
        //this.$refs.uploadFileInput.value = null;
      },
      search () {
        // Items have already been loaded



        if (this.aptPackages.length > 0) return

        // Items have already been requested
        if (this.aptPackagesLoading) return

        this.aptPackagesLoading = true


        appUtils
        .get({
          url:
            "api/apps/debs",
        })
        .then((response) => {
          console.log(response.data);
          this.aptPackagesLoading = false;
          if (response.data.status == 1) {
            console.log("aptlist OK!")
            this.aptPackages = [];
            let listArr = response.data.aptList.split('\n');
            for (let i=1; i<listArr.length; i++) {
              let parts = listArr[i].split('/');
              if (parts.length >= 2) {
                const item = {
                  package: parts[0],
                  desc: listArr[i]
                };
                this.aptPackages.push(item);
              }
            }
          }
        }).catch(err => {
          console.error(err);
          this.aptPackagesLoading = false;
        });
        // Lazily load input items
        fetch('https://api.publicapis.org/entries')
          .then(res => res.json())
          .then(res => {
            const { count, entries } = res
            this.count = count
            this.entries = entries
          })
          .catch(err => {
            console.log(err)
          })
          .finally(() => (this.isLoading = false))
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
        text: this.$t("Apps"),
        to: "/Apps",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Icon"),
        value: "imageUrl",
        sortable: false,
      },
      { text: this.$t("Name"), value: "appName" },
      { text: this.$t("Package"), value: "packageName" },
      { text: "Actions", value: "actions", sortable: false },
    ];
    this.appTypes = [];
    if (appData.isMobile()) {
      this.appTypes.push({ text: this.$t("Android (APK)"), value: "apk" });
    }
    if (appData.isDesktop()) {
      this.appTypes.push({ text: this.$t("Linux (DEB)"), value: "deb" });
    }
    if (this.appTypes.length > 0) {
      this.appType = this.appTypes[0].value;
    }

    this.fileRules = [
      () => {
        if (this.uploadSelectedFile && this.aptPackage ) {
          return this.$t("Please select either APT package or DEB file");
        } else {
          return true;
        }
      }

    ];
    appUtils.loadPageData(page.name,this);

    // Initialize the context for this page
    this.updateContext({
      view: 'init',
      pageType: 'AppsList',
      canUpload: appData.checkPermission('/apps', 'w'),
      canDelete: appData.checkPermission('/apps', 'w'),
      platform: {
        isMobile: appData.isMobile(),
        isDesktop: appData.isDesktop()
      },
      availableAppTypes: this.appTypes,
      currentAppType: this.appType,
      headers: this.headers.map(h => h.text)
    });

    this.refresh();
  },
};

export default page;
</script>