<template>
  <v-app id="inspire" color="bg" >
    <v-navigation-drawer v-model="drawer" app color="bg">
      <v-list-item>
        <v-list-item-content>
          <v-img class="mx-6"
          max-width="160"
          src="./assets/logo.png"
          ></v-img>
          
          
          <!--<v-list-item-subtitle>{{ appData.orgname }}</v-list-item-subtitle>-->
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          
        <v-select
          v-if="appData.isAuthenticated"
          :items="appData.orgs"
          :label="$t('Organization')"
          item-text="domainName"
          item-value="maindomain"
          :value="appData.mainDomain"
          @change="orgChanged"
        ></v-select>
      </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav v-if="appData.isAuthenticated">
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          link
          :to="item.link"
        >
         
          <v-list-item-icon>
           
            <v-icon >{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app
      
      color="bg"
      elevate-on-scroll
    >
      <v-app-bar-nav-icon v-if="!drawer" @click="drawer = true"> </v-app-bar-nav-icon>
      <v-breadcrumbs v-if="appData.isAuthenticated" :items="items" divider=">"></v-breadcrumbs>
      <v-spacer></v-spacer>
      
      <v-menu
        v-if="appData.isAuthenticated"
        :close-on-content-click="true"
        :nudge-width="200"
        offset-x
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon large color="primary">mdi-account</v-icon>
          </v-btn>
        </template>

        <v-card>
          <v-list>
            <v-list-item>
              <v-list-item-avatar>
                <v-icon large color="darken-2">mdi-account</v-icon>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title
                  >{{ appData.firstname }}
                  {{ appData.lastname }}</v-list-item-title
                >
                <v-list-item-subtitle>{{ appData.email }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-list>
            <v-list-item @click="logoutClick">
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main >
      <!--  -->
      <router-view @updatePage="updatePage" @checkLoginLoop="checkLoginLoop" @updatePermissions="updatePermissions"></router-view>
    </v-main>
  </v-app>
</template>
<style scoped>

</style>

<script>
import appData from "./modules/appData";
import appUtils from "./modules/appUtils";

export default {
  data: () => ({
    drawer: true,
    moduleName: "Control Panel",
    menuItems: [],
    items: [
    ],
    appData,
  }),
  methods: {
    updatePage: function (items) {
      //this.moduleName = moduleName;
      //console.log("updatePage: items: " + items);
      if (Array.isArray(items)) {
        this.items = items;
      } else {
        this.items = this.defItems;
      }
    },
    orgChanged: function (val) {
      console.log("orgChanged: "+val);
      appUtils
        .put({
          url: "api/orgs/" + encodeURIComponent(val),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.appData.mainDomain = val;
            this.appData.commit();
            //console.log("currentRoute: "+this.$router.currentRoute.path);
            if (this.$router.currentRoute.path != "/") {
              this.$router.push("/");
            } else { 
              location.reload();
            }

          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    logoutClick: function () {
      appData.logout();
      this.$router.push("/Login");
    },
    checkLoginLoop: function(prevLoginToken){
      //console.log("checkLoginLoop: "+prevLoginToken);
      let thisPage = this;
      setTimeout(function(){
        if (appData.adminLoginToken && appData.adminLoginToken != "" && appData.adminLoginToken == prevLoginToken) {
          appUtils
            .get({
              url: "api/validateLogin",
            })
            .then((response) => {
              
              if (response.data.status == 1) {
                //console.log("Login is valid...");
                thisPage.checkLoginLoop(prevLoginToken);
              } else {
                console.log("Login Error");
                console.log(response.data);
                appData.adminLoginToken = "";
                appData.isAuthenticated = false;
                thisPage.$router.push("/Login");
              }
            }).catch((error) => {
              console.log("Login Error");
              console.log(error);
              appData.adminLoginToken = "";
              appData.isAuthenticated = false;
              thisPage.$router.push("/Login");
            })
        }
      },10000);
    },
    updatePermissions: function() {
      let items = [
      ];
      if (appData.isAuthenticated) {
         items.push({ title: this.$t("Dashboard"), icon: "mdi-chart-bar" , link: "/" });
      }
      if (appData.checkPermission("@/","rw")) {
        items.push({ title: this.$t("Organizations"), icon: "mdi-domain", link: "/Orgs" });
      } else if (appData.checkPermission("/","rw")) {
        items.push({ title: this.$t("Organization"), icon: "mdi-domain", link: "/Org/"+appData.mainDomain });
      }
      if (appData.checkPermission("/profiles","r")) {
        items.push({ title: this.$t("Profiles"), icon: "mdi-account-multiple-outline", link: "/Profiles" });
      }
      if (appData.checkPermission("/groups","r")) {
        items.push({ title: this.$t("Groups"), icon: "mdi-account-group", link: "/Groups" });
      }
      if (appData.checkPermission("/apps","r")) {
        items.push({ title: this.$t("Apps"), icon: "mdi-apps", link: "/Apps" });
      }
      if (appData.isEnterpriseEdition() && appData.checkPermission("/profiles","r")) {
        items.push({ title: this.$t("Telephony"), icon: "mdi-phone-voip", link: "/Telephony" });
      }
      if (appData.checkPermission("@/","rw")) {
        items.push({ title: this.$t("Platforms"), icon: "mdi-server", link: "/Platforms" });
      } 
      if (appData.checkPermission("/","rw")) {
        items.push({ title: this.$t("Logs"), icon: "mdi-list-status", link: "/Logs" });
        if (appData.isDesktop()) {
          items.push({ title: this.$t("Recordings"), icon: "mdi-record-rec", link: "/Recordings"});
        }
        if (appData.isEnterpriseEdition()) {
          items.push({ title: this.$t("Exchange"), icon: "mdi-email", link: "/EmailSetup"});
          items.push({ title: this.$t("Active Directory"), icon: "mdi-microsoft" , link: "/LDAP" });
        }
        items.push({ title: this.$t("Administrators"), icon: "mdi-account-tie" , link: "/Admins" });
        items.push({ title: this.$t("Security"), icon: "mdi-shield-account", link: "/Security" });
      }
      if (appData.isEnterpriseEdition() && appData.checkPermission("/reports","r")) {
        items.push({ title: this.$t("Reports"), icon: "mdi-file-document-multiple-outline" , link: "/Reports"});
      }
      this.menuItems = items;
    },
  },
  created: function () {
    console.log(`this.appData.isAuthenticated: ${this.appData.isAuthenticated}`);
    if (this.appData.isAuthenticated) {
      this.items = [{
        text: this.$t("control-panel"),
        to: "/",
        disabled: false,
      }];
    }
    this.defItems = this.items;
    this.updatePermissions();
    if (appData.adminLoginToken && appData.adminLoginToken != "" && appData.isAuthenticated) {
      this.checkLoginLoop(appData.adminLoginToken);
    }
  },
};
</script>
