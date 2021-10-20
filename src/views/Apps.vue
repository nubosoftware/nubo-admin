<template>
  <v-card color="bg">
    <v-card-title>{{ $t("Apps") }}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="20"
      :loading="loading"
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
            v-if="appData.checkPermission('/apps', 'w')"
            color="primary"
            dark
            class="ma-2"
            @click="webappDialog = true"
          >
            {{ $t("Generate Web App") }}
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:item.imageUrl="{ item }">
        <v-img max-height="40" max-width="40" :src="item.imageUrl"></v-img>
      </template>
      <template v-slot:item.actions="{ item }">
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

let page = {
  name: "LDAP",
  data: () => ({
    headers: [],
    rows: [],
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
    rowClick: function (val) {
      console.log(`rowClick: ${val.packageName}`);
      this.$router.push("/App/" + val.packageName);
    },
    deleteApp: function (val, event) {
      event.stopPropagation();
      this.deleteObj = val;
      this.deleteAppName = val.appName;
      this.dialog = true;
    },
    deleteOK: function () {
      console.log(`deleteApp: ${this.deleteAppName}`);
      this.dialog = false;
      appUtils
        .delete({
          url: "api/apps/" + encodeURIComponent(this.deleteObj.packageName),
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
    },
    startUpload: function () {
      this.uploading = true;
      let formData = new FormData();
      formData.append("file", this.uploadSelectedFile);
      this.uploadAppDesc.uploadAlertType = "info";
      this.uploadAppDesc.uploadStatus = this.$t("Uploading file..");
      let thisPage = this;
      appUtils
        .post({
          url: "api/upload",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: function (progressEvent) {
            var percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(percentCompleted);
            thisPage.uploadProgress = Math.round(percentCompleted / 2);
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
      appUtils
        .put({
          url: "api/apps",
          data: {
            fileName: this.uploadFileName,
            packageName: this.aptPackage,
            appType: this.appType
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
            this.checkUploadStatus();
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
    goToUploadedApp: function () {
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
            if (apkStatus > 0) {
              if (apkStatus == 1) {
                this.uploadAppDesc.uploadStatus = this.$t("Processing apk..");
                this.uploadProgress = 70;
              } else {
                this.uploadAppDesc.uploadStatus = this.$t("Installing app..");
                this.uploadProgress = 90;
              }
              this.uploadAppDesc.uploadAlertType = "info";
              setTimeout(function () {
                thisPage.checkUploadStatus();
              }, 1000);
            } else {
              if (apkStatus == 0) {
                this.uploadAppDesc.uploadStatus = this.$t(
                  "The apk was installed successfully"
                );
                this.uploadAppDesc.uploadAlertType = "success";
                this.refresh();
              } else {
                this.uploadAppDesc.uploadStatus = this.$t(
                  "Error installing apk"
                );
                this.uploadAppDesc.uploadAlertType = "error";
              }
              this.uploadProgress = 0;
              this.uploading = false;
            }
          } else {
            console.log(`status: ${response.data.status}`);
            this.uploadAppDesc.uploadStatus =
              this.$t("Error installing apk") + " - " + response.data.status;
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
          } else {
            console.log(`status: ${response.data.status}`);
            this.rows = [];
          }
        })
        .catch((error) => console.log(error))
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
        text: this.$t("control-panel"),
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
    this.appTypes = [
      { text: this.$t("Android (APK)"), value: "apk" },
      { text: this.$t("Linux (DEB)"), value: "deb" },
    ];
    this.fileRules = [
      () => {
        if (this.uploadSelectedFile && this.aptPackage ) {
          return this.$t("Please select either APT package or DEB file");
        } else {
          return true;
        }
      }
      
    ];
    this.refresh();
  },
};

export default page;
</script>