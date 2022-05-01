<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title>{{ firewall_name }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="details"> {{ $t("Details") }} </v-tab>
          <v-tab key="rules"> {{ $t("Rules") }} </v-tab>
          <v-tab key="profiles"> {{ $t("Profiles") }} </v-tab>
          <v-tab key="groups"> {{ $t("Groups") }} </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item key="details">        
        <v-card flat class="ma-0" color="bg">
          <v-form>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Firewall Name')"
                    v-model="firewall_name"
                  />
                </v-col>                
              </v-row>              

              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn                   
                    color="primary"
                    class="mr-4"
                    @click="saveDetails"
                    v-bind:loading="saveLoading"
                  >
                    Save
                  </v-btn>
                </v-col>
              </v-row>
            </v-container></v-form
          >
        </v-card>
      </v-tab-item>
       <v-tab-item key="rules">
        <v-card flat class="ma-0" color="bg">
          <v-card-title>{{$t("Rules")}}</v-card-title>
          <v-card-text>
            {{$t("Firewall rules control the kind of outbound traffic that is allowed from a remote session. All inbound traffic is not allowed.")}}
          </v-card-text>
          <v-card-title>{{$t("Outbound Rules")}}</v-card-title>
          <v-card-text>
            {{$t("Outbound traffic will only be allowed to the specified addresses and ports. All other traffic will be blocked.")}}
          </v-card-text>
          <v-data-table
            :headers="rulesHeaders"
            :items="rules"
            :loading="loading"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn  color="primary" dark class="mb-2" @click="editRuleItem = null ; addRuleDialog = true">
                  {{ $t("Add Outbound Rule") }}
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item.dport="{ item }">
              <div v-if="item.dport == '0'">{{$t("All")}}</div>              
              <div v-else>{{item.dport}}</div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon  small @click="editRule(item)" class="mx-2">
                mdi-pencil
              </v-icon>
              <v-icon  small @click="deleteRule(item)" class="mx-2">
                mdi-delete
              </v-icon>

            </template>
          </v-data-table>
          <v-dialog v-model="addRuleDialog" max-width="800px" overlay-color="bg">
            <v-card color="bg">
              <v-card-title>
                {{ $t("Add Outbound Rule") }}
              </v-card-title>
              <v-form ref="ruleForm" v-model="addRuleForm">
                <v-container>
                  <v-row>
                    <v-col cols="24" sm="12" md="6">
                      <v-text-field
                        :label="$t('Destination (IP Address or CIDR)')"
                         :rules="ipRules" 
                        v-model="destination"
                      />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                      <v-select
                        :items="protItems"
                        :label="$t('Protocol')"
                         :rules="requiredRules"
                        v-model="prot"
                      ></v-select>                      
                    </v-col>

                    <v-col cols="12" sm="6" md="3" >
                      <v-combobox class="bg" background-color="bg"                      
                       :label="$t('Port')"
                       :items="dportItems"                       
                       v-model="dport"
                       :rules="dportRules"                                 
                      ></v-combobox>
                     
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        :label="$t('Description')"
                        v-model="description"
                      />
                    </v-col>
                  </v-row>
                  <v-row>          
                    <v-col cols="12" sm="6" md="3">
                      <v-btn                        
                        color="primary"
                        class="mr-4"
                        @click="addRule"                       
                      >
                        Save
                      </v-btn>
                    </v-col>
                  </v-row>
            </v-container></v-form
          >
            </v-card>
          </v-dialog>
        </v-card>
       </v-tab-item>
      <v-tab-item key="profiles">
        <v-card flat class="ma-0" color="bg">
          <v-card-title>{{$t("Profiles")}}</v-card-title>
          <v-data-table
            :headers="headers"
            :items="rows"
            :loading="loading"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn  color="primary" dark class="mb-2" @click="addProfile">
                  {{ $t("Assign Firewall to Profiles") }}
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon  small @click="deleteProfile(item)" class="mx-2">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
          <v-dialog v-model="dialog" max-width="800px" overlay-color="bg">
            <v-card color="bg">
              <v-card-title>
                {{ $t("Add Profiles") }}
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                ></v-text-field>
              </v-card-title>
              <v-data-table
                v-model="profilesSelected"
                :headers="profilesHeaders"
                :items="profilesRows"
                :loading="profilesLoading"
                class="elevation-1 ma-4 bg"
                :server-items-length="totalItems"
                :items-per-page="5"
                :options.sync="options"
                :search="search"
                show-select
                multi-sort
                @update:options="updateOptions"
                @click:row="rowClick"
              >
                <template v-slot:header.data-table-select> &nbsp; </template>
                <template v-slot:top>
                  <v-toolbar flat color="bg">
                    <v-btn
                      color="primary"
                      class="mb-2"
                      @click="addSelected"
                      v-bind:disabled="addSelectedDisabled"
                      v-bind:loading="addSelectedLoading"
                    >
                      {{ $t("Assign Selected Profiles") }}
                    </v-btn>
                  </v-toolbar>
                </template>
              </v-data-table>
            </v-card>
          </v-dialog>
        </v-card>
      </v-tab-item>

      <v-tab-item key="groups">
        <v-card flat class="ma-0" color="bg">
          <v-card-title>{{ $t("Groups") }}</v-card-title>
          <v-data-table
            :headers="groupHeaders"
            :items="groupRows"
            :loading="groupLoading"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn  color="primary" dark class="mb-2" @click="addGroup">
                  {{ $t("Assign Firewall to Groups") }}
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item.addomain="{ item }">
              <div v-if="item.groupname == 'All'">{{$t("Automatic")}}</div>
              <div v-else-if="item.addomain == ''">{{$t("Manual")}}</div>
              <div v-else>{{$t("Active Directory")}}</div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon  small @click="deleteGroup(item)" class="mx-2">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
          <v-dialog v-model="groupDialog" max-width="800px" overlay-color="bg">
            <v-card color="bg">
              <v-card-title>
                {{ $t("Add Groups") }}
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="groupSearch"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                ></v-text-field>
              </v-card-title>
              <v-data-table
                :headers="allGroupsHeaders"
                :items="allGroupsRows"
                :loading="allGroupsLoading"
                class="elevation-1 ma-4 bg"
                :search="groupSearch"
                @click:row="groupClick"
              >
              <template v-slot:item.adDomain="{ item }">
              <div v-if="item.groupName == 'All'">{{$t("Automatic")}}</div>
              <div v-else-if="item.adDomain == ''">{{$t("Manual")}}</div>
              <div v-else>{{$t("Active Directory")}}</div>
            </template>
              </v-data-table>
            </v-card>
          </v-dialog>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    

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
<style scoped>
.combo-bg {
  /*background: #f8f5ed;*/
  background-color: #000000;
}
</style>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
const moment = require("moment");

let page = {
  name: "AppDetails",
  components: {
    //HelloWorld
  },
  data: () => ({
    firewall_id: 0,
    firewall_name: "",
    details: {},
    totalNumOfUsers: 0,
    tab: {},
    headers: [],
    rows: [],
    dialog: false,
    profilesHeaders: [],
    profilesRows: [],
    profilesLoading: true,
    search: "",
    profilesSelected: [],
    allSelected: {},
    addSelectedDisabled: true,
    addSelectedLoading: false,
    dialogInstall: false,
    addItemLabel: "",
    groupHeaders: [],
    groupRows: [],
    groupLoading: false,
    groupSearch: "",
    groupDialog: false,
    allGroupsHeaders: [],
    allGroupsRows: [],
    allGroupsLoading: false,
    allGroupSelected: {},
    totalItems: 0,
    loading: true,
    options: {},
    appData,
    saveLoading: false,
    snackbarSave: false,
    snackbarText: "",
    moment: moment,
    dialogDelete: false,
    deleteProfileItem: {},
    deleteItemType: "",
    deleteItemName: "",
    rulesHeaders: [],
    rules: [],
    addRuleDialog: false,
    dportItems: [],
    protItems: [],
    dport: "",
    destination: "",
    description: "",
    prot: "",
    requiredRules: [],
    ipRules: [],
    dportRules: [],
    addRuleForm: true,
    editRuleItem: null,
  }),
  methods: {
    savePage: function () {      
      appUtils.savePageData(`${page.name}`,this,['options','search','tab']);
    },
    updateOptions: function () {
      console.log("updateOptions");
      this.savePage();
      this.refreshProfiles();
    },
    rowClick: function () {
      console.log("rowClick");
    },
    deleteProfile: async function (item) {
      try {       
        await appUtils
        .delete({
          url:
            `api/firewall/${this.firewall_id}/user`,
          data: {
            email: item.email,            
          },
        });        
        
        this.saveLoading = false;
        this.dialog = false;
        this.snackbarText = "Removed";
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
         this.dialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }
    },
    deleteGroup: async function(item) {
      console.log(`deleteGroup: ${JSON.stringify(item,null,2)}`);
      try {       
        await appUtils
        .delete({
          url:
            `api/firewall/${this.firewall_id}/group`,
          data: {
            groupname: item.groupname,
            addomain: item.addomain
          },
        });        
        
        this.saveLoading = false;
        this.dialog = false;
        this.snackbarText = "Removed";
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
         this.dialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }      
      
    },
    

    deleteRule: async function(item) {
      try {
        let rule_id = item.rule_id;
       
        await appUtils
        .delete({
          url:
            `api/firewall/${this.firewall_id}/rule`,
          data: {
            rule_id
          },
        });        
        
        this.saveLoading = false;
        this.addRuleDialog = false;
        this.snackbarText = "Removed";
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
        this.addRuleDialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }      

    },
    editRule: async function(item) {
      try {
        let rule_id = item.rule_id;
       
        await appUtils
        .get({
          url:
            `api/firewall/${this.firewall_id}/rule`,
            params: {
              rule_id
            },          
        });        
        this.editRuleItem = item;
        this.destination=item.destination;
        if (item.dport == 0) {
          this.dport = 'All';
        }
        else {
          this.dport = item.dport;
        }
        
        this.prot = item.prot;
        this.addRuleDialog = true;
        
      } catch (err) {
        console.error(`Error: ${err}`,err);
        this.addRuleDialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }      
    },
    addRule: async function() {
      let v = this.$refs.ruleForm.validate();
      if (!this.addRuleForm) {
        console.log(`addRuleForm: ${this.addRuleForm}, v: ${v}`);
        return;
      }
      try {
        let destination = this.destination;
        let prot = this.prot;
        let dport = this.dport;        
        if (typeof dport == 'string') {
          let arr = dport.split('(');
          if (arr.length>1) {
            dport = arr[0].trim();
          }
        }
        if (dport == 'All') dport = '0';
        let description = this.description;
        let data = {
            destination,
            prot,
            dport,
            description
        };
        let method = appUtils.put;
        if (this.editRuleItem && this.editRuleItem.rule_id) {
          method = appUtils.post;
          data.rule_id= this.editRuleItem.rule_id;
        }
        await method({
          url:
            `api/firewall/${this.firewall_id}/rule`,
          data
        });        
        
        this.saveLoading = false;
        this.addRuleDialog = false;
        if (this.editRuleItem && this.editRuleItem.rule_id) {
          this.snackbarText = "Updated";
        } else {
          this.snackbarText = "Added";
        }
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
        this.addRuleDialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }      

    },
    validatePort: function(port) {
      if (port == 'All') return true;
      if (typeof port == 'string') {        
        let arr = port.split('(');
        if (arr.length>1) {
          port = arr[0].trim();
        }
      }
      if (!port || isNaN(port) || parseInt(port) != port ) {
        console.log(`Validate port error. port: "${port}"`);
        return false;
      }
      return true;
    },
    validateIP: function(ipstr) {
      if (typeof ipstr != 'string') {
          return false;
      }
      let arr = ipstr.split('/');
      if (arr.length > 2 || arr.length < 1) {
          return false;
      }
      if (arr.length == 2) {
          let subnet = arr[1];
          if (isNaN(subnet)  ||  parseInt(subnet) != subnet  || subnet < 0 || subnet > 32 ) {
              return false;
          }
      }
      let ip = arr[0];
      return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
    },    

    loadDetails: function () {
      if (this.refreshTimeout) {
          clearTimeout(this.refreshTimeout);
          this.refreshTimeout = null;
      }
      this.firewall_id = this.$route.params.firewall_id;
      appUtils
        .get({
          url:
            "api/firewall/" + encodeURIComponent(this.firewall_id),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("loadDetails: Success");
            this.firewall_name = response.data.firewall_name;
            this.rules=  response.data.rules;           
            this.rows = response.data.users;
            this.rulesHeaders = [
              {
                text: this.$t("Destination"),
                value: "destination",
              },
              { text: this.$t("Protocol"), value: "prot" },
              { text: this.$t("Port"), value: "dport" },
              { text: this.$t("Description"), value: "description" },
              { text: "Actions", value: "actions", sortable: false },
            ];
            this.requiredRules = [
              (v) => !!v || this.$t("Field is required"),
            ];
            this.ipRules = [
              (v) => this.validateIP(v) || this.$t("IP address is not valid"),
            ];
            this.dportRules = [
              (v) => this.validatePort(v) || this.$t("Port number is not valid"),
            ];
            this.headers = [
              {
                text: this.$t("Last Name"),
                value: "user.lastname",
              },
              { text: this.$t("First Name"), value: "user.firstname" },
              { text: this.$t("Email"), value: "email" },
              { text: "Actions", value: "actions", sortable: false },
            ];
            this.loading = false;
            this.groupLoading = false;
            this.groupRows = response.data.groups;
            this.groupHeaders = [
              {
                text: this.$t("Group Name"),
                value: "groupname",
              },
              { text: this.$t("Group Type"), value: "addomain" },
              { text: "Actions", value: "actions", sortable: false },
            ];
            this.dportItems = [
              'All',
              '80 (HTTP)',
              '443 (HTTPS)',
              '22 (SSH)',
              '3389 (RDP)',
              '5900 (VNC)',
            ];            
            this.protItems = [
              'tcp','udp','icmp'
            ];
            let bcItems = [
              {
                text: this.$t("control-panel"),
                to: "/",
                disabled: false,
              },
              {
                text: this.$t("Firewalls"),
                to: "/Firewalls",
                disabled: false,
              },
              {
                text: this.firewall_name,
                to: "/Firewall/" + this.firewall_id,
                disabled: false,
              },
            ];
            this.$emit("updatePage", bcItems);
            this.refreshTimeout = setTimeout(this.loadDetails,5000);
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    saveDetails: function () {
      this.saveLoading = true;

      appUtils
        .post({
          url:
             "api/firewall/" + encodeURIComponent(this.firewall_id),
          data: {
            firewall_name: this.firewall_name,            
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.saveLoading = false;
            this.snackbarText = "Saved";
            this.snackbarSave = true;
            this.loadDetails();
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = "Error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.saveLoading = false));
    },
    addGroup: function () {
      this.groupDialog = true;
      this.loadAllGroups();
    },
    loadAllGroups: function () {
      this.allGroupsLoading = true;
      this.allGroupsHeaders = [
        
        {
          text: this.$t("Group Name"),
          value: "groupName",
        },
        { text: this.$t("Group Type"), value: "adDomain" },
      ];
      appUtils
        .get({
          url: "api/groups",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.allGroupsRows = response.data.groups;
            this.allGroupsLoading = false;
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    groupClick: async function(item) {
      console.log(`groupClick: ${JSON.stringify(item,null,2)}`);
      try {       
        await appUtils
        .put({
          url:
            `api/firewall/${this.firewall_id}/group`,
          data: {
            groupname: item.groupName,
            addomain: item.adDomain
          },
        });        
        
        this.saveLoading = false;
        this.groupDialog = false;
        this.snackbarText = "Added";
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
         this.dialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }      
      
    },
    addProfile: function () {
      this.dialog = true;
      this.allSelected = [];
      this.addSelectedDisabled = true;
     
    },
    addSelected: async function () {
      //console.log(`addSelected: :${JSON.stringify(this.profilesSelected,null,2)}`);
      try {
        for (const item of this.profilesSelected) {
          await appUtils
          .put({
            url:
              `api/firewall/${this.firewall_id}/user`,
            data: {
              email: item.email,            
            },
          });        
        }
        this.saveLoading = false;
        this.dialog = false;
        this.snackbarText = "Saved";
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
         this.dialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }
      
    },            
    refreshProfiles: function () {
      this.profilesLoading = true;
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      appUtils
        .post({
          url: "api/profiles",
          data: {
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search,
          },
        })
        .then((response) => {
          this.profilesLoading = false;
          console.log(response.data);
          if (response.data.status == 1) {
            this.profilesRows = response.data.profiles;
            this.totalItems = response.data.totalItems;
            let newSelected = [];
            this.profilesRows.forEach((element) => {
              if (this.allSelected[element.email]) {
                newSelected.push(element);
              }
            });
            this.profilesSelected = newSelected;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
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
        text: this.$t("Firewalls"),
        to: "/Firewalls",
        disabled: false,
      },
      {
        text: this.$route.params.firewall_id,
        to: "/Firewall/" + this.$route.params.firewall_id,
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    //
    this.profilesHeaders = [
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
    ];   
    appUtils.loadPageData(page.name,this);
    this.loadDetails();
  },
  
  beforeDestroy: function () {
    console.log('lifecycle: beforeDestroy');
    if (this.refreshTimeout) {
          clearTimeout(this.refreshTimeout);
          this.refreshTimeout = null;
    }
  },
  watch: {
    tab: function (newVal) {
      console.log(`tab: ${newVal}`);
      this.savePage();
    },
    search: function (newVal) {
      console.log(`search: ${newVal}`);
      this.savePage();
      if (newVal.length > 1 || newVal.length == 0) {
        this.refreshProfiles();
      }
    },
    profilesSelected: function (arr) {
      console.log(`profilesSelected: ${JSON.stringify(arr, null, 2)}`);
      let addKeys = {};
      arr.forEach((element) => {
        addKeys[element.email] = element.email;
        //console.log(`Add ${element.email}`);
      });
      Object.assign(this.allSelected, addKeys);
      this.profilesRows.forEach((element) => {
        if (!addKeys[element.email]) {
          //delKeys[element.email] = element.email;
          delete this.allSelected[element.email];
          //console.log(`Remove ${element.email}`);
        }
      });
      if (Object.keys(this.allSelected).length > 0) {
        this.addSelectedDisabled = false;
      } else {
        this.addSelectedDisabled = true;
      }      
    },
  },
};

export default page;
</script>
