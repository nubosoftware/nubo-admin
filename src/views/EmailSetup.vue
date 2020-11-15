<template>
  <v-card color="bg">
    <v-card-title>
      {{ $t("Exchange Setup") }}
    </v-card-title>
    <v-form>
            <v-container>
              <v-row>
                <v-col >
                  <v-switch
                    v-model="emailStatus"
                    :label="$t(`Set exchange information for all users`)"
                  ></v-switch>
                </v-col>
              </v-row>
              <v-row>
                <v-col >
                  <v-text-field
                    :label="$t('Server')"
                    v-model="serverUrl"
                    :disabled="!emailStatus"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col >
                  <v-text-field
                    :label="$t('Port')"
                    v-model="port"
                    :disabled="!emailStatus"
                  />
                </v-col>
                <v-col >
                  <v-switch
                    v-model="sslType"
                    :label="$t(`Secure SSL Only`)"
                    :disabled="!emailStatus"
                  ></v-switch>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    color="primary"
                    class="mr-4"
                    @click="saveDetails"
                    v-bind:loading="loading"
                  >
                    Save
                  </v-btn>
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

let page = {
  name: "EmailSetup",
  data: () => ({
    port: "443",
    serverUrl: "",
    sslType: false,
    emailStatus: 0,
    loading: true,
    options: {},
    snackbarSave: false,
    snackbarText: "",
    appData
  }),
  methods: {
    

    refresh: function() {
      appUtils
        .get({
          url: "api/email"
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.serverUrl = response.data.serverUrl;
            if (this.serverUrl.startsWith("https://")) {
              var url = new URL(this.serverUrl);
              this.serverUrl = url.hostname;
            }
            this.sslType = (response.data.sslType == "1" ? true : false);
            this.port = response.data.port;
            this.emailStatus = true;
          } else if (response.data.status == 0) {
            this.serverUrl = "";
            this.emailStatus = false;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    saveDetails: function() {
      if (this.emailStatus) {
        appUtils
          .post({
            url: "api/email",
            data: {
              serverUrl: this.serverUrl,
              port: this.port,
              sslType: (this.sslType ? "1" : "0"),
            }
          })
          .then(response => {
            console.log(response.data);
            if (response.data.status == 1) {
              console.log(`status: ${response.data.status}`);
              this.snackbarSave = true;
              this.snackbarText = this.$t("Saved");

            } else {
              console.log(`status: ${response.data.status}`);
              this.snackbarSave = true;
              this.snackbarText = this.$t("Error");
            }
          })
          .catch(error => console.log(error))
          .finally(() => (this.loading = false));
      } else {
        appUtils
          .delete({
            url: "api/email",
          })
          .then(response => {
            console.log(response.data);
            if (response.data.status == 1) {
              console.log(`status: ${response.data.status}`);
              this.snackbarSave = true;
              this.snackbarText = this.$t("Saved");

            } else {
              console.log(`status: ${response.data.status}`);
              this.snackbarSave = true;
              this.snackbarText = this.$t("Error");
            }
          })
          .catch(error => console.log(error))
          .finally(() => (this.loading = false));
      }
    },
  },
  
  created: function() {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        href: "/#/",
        disabled: false
      },
      {
        text: this.$t("Exchange Setup"),
        href: "/#/EmailSetup",
        disabled: false
      }
    ];
    this.$emit("updatePage", bcItems);
    
    this.refresh();
  }
};

export default page;
</script>
