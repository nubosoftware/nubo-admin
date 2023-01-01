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
    }),
    methods: {
      savePage: function () {      
        appUtils.savePageData(`${page.name}`,this,['options','searchPlugins']);
      },
      updateOptions() {      
        this.savePage();
      },
      rowClick: function (val) {
        console.log(`rowClick: ${val.id}`);
        this.$router.push("/Plugin/" + val.id);
      },
      disableEnableClick: function (val, event) {
        event.stopPropagation();
        console.log(`disableClick: ${val.id}`);
        this.savePage();
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
              this.refresh();
            } else {
              this.snackbarText = this.$t("Error");
              this.snackbarSave = true;
            }
          })
          .catch((error) => {
            console.log(error);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          });
      },
      deletePlugin: function (val, event) {
        event.stopPropagation();
        this.deleteObj = val;
        this.deletePluginName = val.name;
        this.dialog = true;
        //"id","version","name","description","active"
      },
      deleteOK: function () {
        console.log(`deletePlugin: ${this.deletePluginName}`);
        this.dialog = false;
        this.savePage();
        appUtils
          .delete({
            url: "api/plugins/" + encodeURIComponent(this.deleteObj.id),
            // data: {            
            //   rebuildImage: this.rebuildImage
            // },
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
      closeUpload: function(){
        this.uploadDialog = false;
        this.uploading = false;
        this.uploadProgress = 0;
        this.uploadFileName = "";
        this.uploadSelectedFile = "";
        this.uploadPluginDesc = {};    
      },
      startUpload: function () {
        this.uploading = true;
        let formData = new FormData();
        formData.append("file", this.uploadSelectedFile);
        this.uploadPluginDesc.uploadAlertType = "info";
        this.uploadPluginDesc.uploadStatus = this.$t("Uploading file..");
        let thisPage = this;
        this.savePage();
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
            },
          })
          .then((response) => {
            console.log(response.data);
            this.uploadSelectedFile = null;
            if (response.data.status == 1) {
              console.log(`status: ${response.data.status}`);
              //   this.uploadFileName = response.data.uploadFileName;
              this.uploadPluginDesc.uploadStatus = this.$t(
                  "The plugin was installed successfully"
                );
                this.uploadPluginDesc.uploadAlertType = "success";
                this.uploadProgress = 100;
                this.refresh();
              //this.uploadAPK();
            } else {
              console.log(`status: ${response.data.status}`);
              this.uploading = false;
              this.uploadPluginDesc.uploadStatus =
                this.$t("Error uploading plugin") + " - " + response.data.message;
              this.uploadPluginDesc.uploadAlertType = "error";
            }
          })
          .catch((error) => {
            this.uploadSelectedFile = null;
            this.uploading = false;
            this.uploadPluginDesc.uploadStatus =
              this.$t("Error uploading plugin") + " - " + error;
            this.uploadPluginDesc.uploadAlertType = "error";
          })
          .finally(() => (this.loading = false));
      },
      
      goToUploadedPlugin: function () {
        this.$router.push("/Plugin/" + this.uploadPluginDesc.packageName);
      },
      checkUploadStatus: function () {
        let thisPage = this;
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
              //this.uploading = false;
              /*
              apkStatus: 1
              message: ""
              status: "1"
              */
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
                setTimeout(function () {
                  thisPage.checkUploadStatus();
                }, 1000);
              } else {
                if (apkStatus == 0) {
                  this.uploadPluginDesc.uploadStatus = this.$t(
                    "The apk was installed successfully"
                  );
                  this.uploadPluginDesc.uploadAlertType = "success";
                  this.refresh();
                } else {
                  this.uploadPluginDesc.uploadStatus = this.$t(
                    "Error installing apk"
                  );
                  this.uploadPluginDesc.uploadAlertType = "error";
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
            }
          })
          .catch((error) => {
            this.uploadPluginDesc.uploadStatus =
              this.$t("Error installing apk") + " - " + error;
            this.uploadPluginDesc.uploadAlertType = "error";
            this.uploading = false;
          })
          .finally(() => (this.loading = false));
      },
      refresh: function () {
        appUtils
          .get({
            url: "api/plugins",
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
              this.rows = response.data.results;
            } else {
              console.log(`status: ${response.data.status}`);
              this.rows = [];
            }
          })
          .catch((error) => console.log(error))
          .finally(() => (this.loading = false));
      },
      
    },
    watch: {
        
        uploadSelectedFile() {
          this.uploadValid = this.$refs.uploadForm.validate();
        },
        searchPlugins() {
          this.savePage();
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
        // {
        //   text: this.$t("Icon"),
        //   value: "imageUrl",
        //   sortable: false,
        // },
        { text: this.$t("ID"), value: "id" },
        { text: this.$t("Name"), value: "name" },
        { text: this.$t("Version"), value: "version" },        
        { text: this.$t("Description"), value: "description" },
        { text: this.$t("Active"), value: "active" },
        { text: this.$t("Status"), value: "status" },
        { text: "Actions", value: "actions", sortable: false },
        //"id","version","name","description","active"
      ];
               
      
      this.fileRules = [
        () => {
            return true;
        //   if (this.uploadSelectedFile && this.aptPackage ) {
        //     return this.$t("Please select either APT package or DEB file");
        //   } else {
        //     return true;
        //   }
        }
        
      ];
      appUtils.loadPageData(page.name,this);
      this.refresh();
    },
  };
  
  export default page;
  </script>