<template>
  <v-card color="bg">
    <v-card-title>
      {{$t("Organization List")}}
      <v-spacer></v-spacer>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :loading="loading"

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
              @click="addOrg"
            >
              {{$t("Add Organization")}}
            </v-btn>
      </v-toolbar>
    </template>
    <template v-slot:[`item.actions`]="{ item }">
      <v-icon small @click="$router.push('/Org/' + item.maindomain)" class="mx-2"> mdi-pencil </v-icon>
      <v-icon v-if="item.maindomain != appData.mainDomain" small @click="deleteOrgDialog(item)" class="mx-2"> mdi-delete </v-icon>
    </template>

    </v-data-table>

    <v-dialog v-model="dialogDeleteOrg" max-width="500px" color="bg">
          <v-card color="bg">
            <v-card-subtitle class="headline">{{$t('Are you sure you want to delete organization',{domain: deleteItem.maindomain })}}</v-card-subtitle>
            <v-card-text>{{$t('Warning: All data including profiles, apps, and configuration data will be deleted!')}}</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="dialogDeleteOrg = false">{{$t('Cancel')}}</v-btn>
              <v-btn color="error"  @click="deleteOrg()">{{$t('OK')}}</v-btn>
              <v-spacer></v-spacer>
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

  <!--<v-btn @click="refresh">Refresh</v-btn>



  -->
</template>



 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
import contextUpdater from "../mixins/contextUpdater";

let page = {
  name: "Orgs",
  mixins: [contextUpdater],
  data: () => ({
    headers: [],
    rows: [],
    dialog: false,
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    snackbarSave: false,
    snackbarText: "",
    dialogDeleteOrg: false,
    deleteItem: {},
    resetOrgsInAppData: false,
    appData
  }),
  methods: {
    addOrg: function() {
      /*this.dialog = true;
      this.refreshProfiles();*/

      // Update context before navigating to add org form
      this.updateContext({
        view: 'orgs_list',
        action: 'add_org',
        navigating: true
      });

      this.$router.push('/Org/');
    },


    rowClick: function(val) {
      console.log(`rowClick: ${val.maindomain}`);

      // Update context before navigation
      this.updateContext({
        view: 'orgs_list',
        action: 'select_org',
        selectedOrg: {
          domain: val.maindomain,
          name: val.orgname
        }
      });

      this.$router.push('/Admin/' + val.maindomain);
    },
    deleteOrgDialog: function(item) {
        this.deleteItem = item;
        this.dialogDeleteOrg = true;

        // Update context when delete dialog opens
        this.updateContext({
          view: 'delete_org_dialog',
          action: 'confirm_delete',
          orgToDelete: {
            domain: item.maindomain,
            name: item.orgname
          }
        });
    },
    deleteOrg: function() {
      console.log(`Delete org: ${this.deleteItem.maindomain}`);
      this.dialogDeleteOrg = false;

      // Update context before deleting
      this.updateContext({
        view: 'deleting_org',
        action: 'delete',
        orgToDelete: {
          domain: this.deleteItem.maindomain,
          name: this.deleteItem.orgname
        }
      });

      appUtils.delete({
        url: "api/orgs/"+encodeURIComponent(this.deleteItem.maindomain),
      }).then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Organization removed");
            this.snackbarSave = true;
            this.resetOrgsInAppData = true;

            // Update context after successful deletion
            this.updateContext({
              view: 'org_deleted',
              action: 'delete_success',
              status: 'success',
              deletedOrg: {
                domain: this.deleteItem.maindomain,
                name: this.deleteItem.orgname
              }
            });

            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error") + ` - ${response.data.message}`;
            this.snackbarSave = true;

            // Update context after delete error
            this.updateContext({
              view: 'delete_org_error',
              action: 'delete_failed',
              status: 'error',
              error: response.data.message,
              orgToDelete: {
                domain: this.deleteItem.maindomain,
                name: this.deleteItem.orgname
              }
            });
          }
        })
        .catch(error => {
          console.log(error);

          // Update context on exception
          this.updateContext({
            view: 'delete_org_exception',
            action: 'delete_exception',
            status: 'error',
            error: error.message || 'Exception occurred while deleting organization',
            orgToDelete: {
              domain: this.deleteItem.maindomain,
              name: this.deleteItem.orgname
            }
          });
        })
        .finally(() => (this.loading = false));
    },



    refresh: function() {
      // Update context before fetching organizations
      this.updateContext({
        view: 'orgs_list',
        action: 'loading',
        loading: true
      });

      appUtils
        .get({
          url: "api/orgs",
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.orgs;
            if (this.resetOrgsInAppData ) {
                appData.resetOrgs(this.rows);
            }

            // Update context after loading organizations
            this.updateContext({
              view: 'orgs_list',
              action: 'loaded',
              loading: false,
              organizations: {
                count: this.rows.length,
                items: this.rows
              },
              currentDomain: appData.mainDomain
            });
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");

            // Update context on error
            this.updateContext({
              view: 'orgs_list',
              action: 'load_error',
              loading: false,
              error: 'Failed to load organizations',
              status: response.data.status
            });
          }
        })
        .catch(error => {
          console.log(error);
          // Update context on exception
          this.updateContext({
            view: 'orgs_list',
            action: 'load_exception',
            loading: false,
            error: error.message || 'Exception occurred while loading organizations'
          });
        })
        .finally(() => (this.loading = false));
    }
  },
  created: function() {
    let bcItems = [{
      text: appData.productName,
      to: "/",
      disabled: false,
    }, {
      text: this.$t("Organizations"),
      to: "/Orgs",
      disabled: false,
    }];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Domain"),
        value: "maindomain"
      },
      { text: this.$t("Organization Name"), value: "orgname" },
      { text: this.$t('Actions'), value: 'actions', sortable: false }
    ];

    // Initialize context when component is created
    this.updateContext({
      view: 'orgs_list',
      action: 'initializing',
      loading: true,
      userPermissions: {
        canAddOrgs: appData.checkPermission('/orgs', 'i'),
        canEditOrgs: appData.checkPermission('/orgs', 'w'),
        canDeleteOrgs: appData.checkPermission('/orgs', 'd')
      }
    });

    this.refresh();
  },
  watch: {

  }
};

export default page;
</script>