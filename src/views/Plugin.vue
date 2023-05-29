<template>
  <v-card color="bg">
    <v-card-title>
      {{ $t("Plugin") }}
    </v-card-title>
    <v-form ref="pluginForm" v-model="formValid">
      <v-container>
        <v-row >
          <v-col class="py-2">
            <v-text-field
                    :label="$t('Name')"
                    v-model="details.name"
                    readonly />
          </v-col>
        </v-row>
        <v-row >
          <v-col class="py-2">
            <v-text-field
                    :label="$t('Version')"
                    v-model="details.version"
                    readonly />
          </v-col>
        </v-row>
        <v-row >
          <v-col class="py-2">
            <v-text-field
                    :label="$t('Description')"
                    v-model="details.description"
                    readonly />
          </v-col>
        </v-row>
        <v-row >
          <v-col class="py-2">
            <v-text-field
                    :label="$t('Active')"
                    v-model="details.activeText"
                    readonly />
          </v-col>
          <v-col class="py-2">
            <v-btn
              v-if="details.active == 0"
              color="primary"
              class="mr-4"
              @click="enableDisable"
              
            >
              {{$t('Enable')}}
            </v-btn>
            <v-btn
              v-if="details.active == 1"
              color="primary"
              class="mr-4"
              @click="enableDisable"
              
            >
              {{$t('Disable')}}
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-for="{key, name, dataType} in details.confDescriptions" :key="key">
          <v-col class="py-2">
            <v-text-field v-if="dataType == 'string'"
                    :label="name"
                    v-model="details.configuration[key]"
                  />
            <v-text-field v-if="dataType == 'number'"
                    :label="name"
                    v-model="details.configuration[key]"
                    :rules="[numeric]"
                  />
            <v-checkbox v-if="dataType == 'boolean'"
              :label="name"
              v-model="details.configuration[key]"
            />
            <v-textarea v-if="dataType == 'object'"
              :label="name"
              v-model="configurationJson[key]"
              :rules="[json]"
            />
            <v-textarea v-if="dataType == 'array'"
              :label="name"
              v-model="configurationJson[key]"
              :rules="[jsonArray]"
            />
          </v-col>
        </v-row>
        <v-row >
          <v-col class="py-2">
            <v-chip color="green" v-if="details.status == 2">{{$t("Loaded")}}</v-chip>
            <v-chip color="red" v-else-if="details.status == 1">{{$t("Error")}}</v-chip>
            <v-chip v-else>{{$t("Not loaded")}}</v-chip>
          </v-col>
        </v-row>
        
        <v-row v-if="details.status == 1">
          <v-col class="py-2">
            <v-text-field
                    :label="$t('Error')"
                    v-model="details.error"
                    readonly />
          </v-col>
        </v-row>
        
      </v-container>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              color="primary"
              class="mr-4"
              :disabled="!formValid"
              @click="saveClick"
              
            >
              {{$t('Save')}}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              color="primary"
              class="mr-4"
              @click="uploadDialog = true"
              v-bind:loading="saveLoading"
            >
              {{$t('Upload Plugin Update')}}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-form
    >

    <v-dialog
        v-model="uploadDialog"
        persistent
        max-width="1000"
        overlay-color="bg"
      >
        <v-card color="bg">
          <v-card-title>
            {{ $t("Upload Plugin Update") }}
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
                  
                </v-alert>
              </v-col>
            </v-row>
            </v-form>
          </v-container>
          <v-card-actions class="mx-4">
            <v-spacer></v-spacer>
            <v-btn 
              v-if="uploadProgress  < 100"
              color="warning" @click="closeUpload">
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
              :disabled="(!uploadSelectedFile ) || uploading "
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
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackbarSave = false"
        >
          {{ $t("Close") }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Plugin",
  data: () => ({
    id: "",    
    formValid: false,
    snackbarSave: false,
    snackbarText: "",
    details: {},
    permissions: {},
    saveLoading: false,
    uploadDialog: false,
    filename: null,
    uploading: false,
    uploadProgress: 0,
    uploadFileName: "",
    uploadSelectedFile: null,
    uploadPluginDesc: {},
    configurationJson: {},
    numeric: value => {
      if (value == null || value == "") {
        return true;
      }
      return !isNaN(value);
    },
    json: value => {      
      try {
        let obj = JSON.parse(value);
        if (obj && typeof obj === "object") {
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    },
    jsonArray: value => {      
      try {
        let obj = JSON.parse(value);
        if (obj && typeof obj === "object" && Array.isArray(obj)) {
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    }, 
    appData
  }),
  methods: {
    closeUpload: function(){
      this.uploadDialog = false;
      this.uploading = false;
      this.uploadProgress = 0;
      this.uploadFileName = "";
      this.uploadSelectedFile = "";
      this.uploadPluginDesc = {};
      this.filename = null;
    },
    selectFile: function (file) {
      console.log("selectFile: " + file);
      this.uploadSelectedFile = file;
    },
    startUpload: function () {
        this.uploading = true;
        let formData = new FormData();
        formData.append("file", this.uploadSelectedFile);
        this.uploadPluginDesc.uploadAlertType = "info";
        this.uploadPluginDesc.uploadStatus = this.$t("Uploading file..");
        let thisPage = this;       
        appUtils
          .put({
            url: "api/plugins/"+encodeURIComponent(this.id),
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
                this.uploadProgress = 100;
                this.uploadPluginDesc.uploadAlertType = "success";
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
    enableDisable: function () {
      appUtils
          .post({
            url: "api/plugins/" + encodeURIComponent(this.id),
            data: {
              active: !this.details.active,              
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
    saveClick: function() {
      this.saveLoading = true;
      this.$refs.pluginForm.validate();
      if (!this.formValid) {
        console.log("Form not valid");
        this.saveLoading = false;
        return;
      }
      if (this.details.confDescriptions) {
        this.details.confDescriptions.forEach((element) => {
          if ( (element.dataType == "object") || (element.dataType == "array") ) {
            let json = this.configurationJson[element.key];
            if (json) {
              try {
                this.details.configuration[element.key] = JSON.parse(json);
              } catch (error) {
                console.log(error);
              }
            }            
          }
        });
      }
      appUtils
        .post({
          url: "api/plugins/" + encodeURIComponent(this.id),
          data: {
            configuration: this.details.configuration,
            active: this.details.active,
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
        })
        .finally(() => (this.saveLoading = false));    
    },
    refresh: function () {
      console.log(`plugin: ${this.id}`);
      appUtils
        .get({
          url: "api/plugins/" + encodeURIComponent(this.id),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.details = response.data.plugin;     
            this.details.activeText = this.details.active  ? this.$t("Enabled") : this.$t("Disabled");       
            if (this.details.confDescriptions) {
              this.details.confDescriptions.forEach((element) => {
                if ( (element.dataType == "object") || (element.dataType == "array") ) {
                  let obj = this.details.configuration[element.key];
                  if (!obj) {
                    if (element.dataType == "object") {
                      obj = {};
                    } else {
                      obj = [];
                    }
                  }
                  this.configurationJson[element.key] = JSON.stringify(obj, null, 2);
                }
              });
            }

          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },

    updatePageHead: function () {
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
        {
          text: this.id,
          to: "/Plugin/" + this.id,
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
    },
  },
  created: function () {
    this.id = this.$route.params.id;
    this.updatePageHead();    
    this.refresh();
  },
  
};

export default page;
</script>
