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

              <v-row v-if="emailStatus">
                <v-col>
                  <v-radio-group v-model="groupFilterMode" :label="$t('Apply Exchange to')">
                    <v-radio :label="$t('All users')" value="all"></v-radio>
                    <v-radio :label="$t('Only users in selected groups')" value="include"></v-radio>
                    <v-radio :label="$t('All users except those in selected groups')" value="exclude"></v-radio>
                  </v-radio-group>
                </v-col>
              </v-row>

              <v-row v-if="emailStatus && groupFilterMode !== 'all'">
                <v-col>
                  <v-autocomplete
                    v-model="groupFilterGroups"
                    :items="availableGroups"
                    :label="$t('Select groups')"
                    multiple
                    chips
                    deletable-chips
                    item-text="text"
                    item-value="value"
                  ></v-autocomplete>
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
    groupFilterMode: "all",
    groupFilterGroups: [],
    availableGroups: [],
    appData
  }),
  methods: {
    loadGroups: function() {
      appUtils
        .get({ url: "api/groups" })
        .then(response => {
          if (response.data.status == 1 && response.data.groups) {
            this.availableGroups = response.data.groups.map(g => ({
              text: g.adDomain ? (g.groupName + " (" + g.adDomain + ")") : g.groupName,
              value: g.adDomain ? (g.groupName + "#" + g.adDomain) : g.groupName
            }));
          }
        })
        .catch(error => console.log(error));
    },

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
            this.groupFilterMode = response.data.groupFilterMode || "all";
            this.groupFilterGroups = response.data.groupFilterGroups || [];
          } else if (response.data.status == 0) {
            this.serverUrl = "";
            this.emailStatus = false;
            this.groupFilterMode = "all";
            this.groupFilterGroups = [];
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
              groupFilterMode: this.groupFilterMode,
              groupFilterGroups: this.groupFilterGroups,
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
        this.groupFilterMode = "all";
        this.groupFilterGroups = [];
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
        text: appData.productName,
        to: "/",
        disabled: false
      },
      {
        text: this.$t("Exchange Setup"),
        to: "/EmailSetup",
        disabled: false
      }
    ];
    this.$emit("updatePage", bcItems);

    this.loadGroups();
    this.refresh();
  }
};

export default page;
</script>
