<template>
  <v-app id="inspire" color="bg">
    <v-navigation-drawer v-model="drawer" app color="bg">
      <v-list-item >
        <v-list-item-content >
          <v-img class="mx-6 justify-center"
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

      <!-- Chatbot toggle button -->
      <v-btn
        v-if="appData.isAuthenticated && appData.activePlugins.includes('session-monitor')"
        icon
        @click="toggleChatbot"
        class="mr-2"
      >
        <v-icon color="primary">{{ chatbotDrawer ? 'mdi-chat' : 'mdi-chat-outline' }}</v-icon>
      </v-btn>

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

    <v-main :class="{'content-with-chatbot': chatbotDrawer}">
      <router-view
        @updatePage="updatePage"
        @checkLoginLoop="checkLoginLoop"
        @updatePermissions="updatePermissions"
        @updateAppState="updateAppState"
      ></router-view>
    </v-main>

    <!-- Chatbot Sidebar Component -->
    <chatbot-sidebar
      v-if="appData.activePlugins.includes('session-monitor')"
      v-model="chatbotDrawer"
    />

    <v-dialog v-model="networkErrorDialog" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('Network Error') }}
        </v-card-title>
        <v-card-text>
          {{ $t('The service is not available. Please check your network connection.') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="retryConnection">
            {{ $t('Try Again') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>
<style scoped>
.content-with-chatbot {
  transition: all 0.3s ease;
}
</style>

<script>
import appData from "./modules/appData";
import appUtils from "./modules/appUtils";
import plugins from "./plugins";
import ChatbotSidebar from "./components/ChatbotSidebar.vue";

export default {
  components: {
    ChatbotSidebar
  },
  data: () => ({
    drawer: true,
    moduleName: "Control Panel",
    menuItems: [],
    items: [
    ],
    appData,
    networkErrorDialog: false,
    currentLoginToken: '',
    // Chatbot related data
    chatbotDrawer: false
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
      appData.breadcrumbs = this.items;
    },

    // Method to update global app state for chatbot context
    updateAppState: function (pageData) {
      if (!window.$nuboAppState) {
        window.$nuboAppState = {};
      }

      // Reset the state to include only the current page data instead of accumulating state
      window.$nuboAppState = {
        lastUpdated: new Date().toISOString(),
        ...pageData
      };

      /*
      * Example usage in a component:
      *
      * this.$emit('updateAppState', {
      *   componentName: 'ProfileDetails',
      *   currentProfile: this.profile,
      *   selectedItems: this.selectedItems,
      *   formData: this.formData,
      *   // Any other relevant state information
      * });
      *
      * This information will be available to the chatbot when users ask questions
      * related to the current state of the application.
      */
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
    logoutClick: async function () {
      const response = await appUtils.get({
        url: "api/logout",
      });
      console.log(`Logout: `,response.data);
      appData.logout();
      this.$router.push("/Login");
    },
    checkLoginLoop: function(prevLoginToken, immediate = false) {
      this.currentLoginToken = prevLoginToken;
      let thisPage = this;

      const checkLogin = () => {
        if (appData.adminLoginToken && appData.adminLoginToken != "" && appData.adminLoginToken == prevLoginToken) {
          appUtils
            .get({
              url: "api/validateLogin",
            })
            .then((response) => {
              if (response.data.status == 1) {
                thisPage.checkLoginLoop(prevLoginToken);
                if (response.data.activePlugins && Array.isArray(response.data.activePlugins)) {
                  appData.activePlugins = response.data.activePlugins;
                  appData.commit();
                }
              } else {
                console.log("Login Error");
                console.log(response.data);
                appData.adminLoginToken = "";
                appData.isAuthenticated = false;
                thisPage.$router.push("/Login");
              }
            }).catch((error) => {
              console.log("Login HTTP Error");
              console.log(error);
              thisPage.networkErrorDialog = true;
            })
        }
      };

      if (immediate) {
        checkLogin();
      } else {
        setTimeout(checkLogin, 10000);
      }
    },
    updatePermissions: function() {
      let items = [
      ];
      let disalbeMenuItems = plugins.customDisabledMenuItems;
      if (window.customDisabledMenuItems && Array.isArray(window.customDisabledMenuItems)) {
        disalbeMenuItems = disalbeMenuItems.concat(window.customDisabledMenuItems);
      }
      if (appData.isAuthenticated) {
         items.push({ title: this.$t("Dashboard"), icon: "mdi-chart-bar" , link: "/" });
      }
      if (appData.checkPermission("@/","rw") && !disalbeMenuItems.includes("Organizations")) {
        items.push({ title: this.$t("Organizations"), icon: "mdi-domain", link: "/Orgs" });
      } else if (appData.checkPermission("/","rw") && !disalbeMenuItems.includes("Organizations")) {
        items.push({ title: this.$t("Organization"), icon: "mdi-domain", link: "/Org/"+appData.mainDomain });
      }
      if (appData.checkPermission("/profiles","r") && !disalbeMenuItems.includes("Profiles")) {
        items.push({ title: this.$t("Profiles"), icon: "mdi-account-multiple-outline", link: "/Profiles" });
      }
      if (appData.checkPermission("/groups","r") && !disalbeMenuItems.includes("Groups")) {
        items.push({ title: this.$t("Groups"), icon: "mdi-account-group", link: "/Groups" });
      }
      if (appData.checkPermission("/apps","r") && !disalbeMenuItems.includes("Apps")) {
        items.push({ title: this.$t("Apps"), icon: "mdi-apps", link: "/Apps" });
      }
      if (appData.isEnterpriseEdition() && appData.checkPermission("/profiles","r") && !disalbeMenuItems.includes("Telephony")) {
        items.push({ title: this.$t("Telephony"), icon: "mdi-phone-voip", link: "/Telephony" });
      }
      if (appData.checkPermission("@/","rw") && !disalbeMenuItems.includes("Platforms")) {
        items.push({ title: this.$t("Platforms"), icon: "mdi-server", link: "/Platforms" });
      }
      if (appData.pluginsEnabled && appData.checkPermission("@/","rw") && !disalbeMenuItems.includes("Plugins")) {
        items.push({ title: this.$t("Plugins"), icon: "mdi-toy-brick", link: "/Plugins" });
      }
      if (appData.checkPermission("/","rw")) {
        if (!disalbeMenuItems.includes("Logs")) {
          items.push({ title: this.$t("Logs"), icon: "mdi-list-status", link: "/Logs" });
        }
        if (!disalbeMenuItems.includes("Recordings")) {
          items.push({ title: this.$t("Recordings"), icon: "mdi-record-rec", link: "/Recordings"});
        }
        // if (appData.isDesktop()) {
        if (appData.isEnterpriseEdition() && !disalbeMenuItems.includes("Firewalls")) {
          items.push({ title: this.$t("Firewalls"), icon: "mdi-fire", link: "/Firewalls"});
        }
        // }
        if (appData.isEnterpriseEdition()) {
          if (!disalbeMenuItems.includes("EmailSetup")) {
            items.push({ title: this.$t("Exchange"), icon: "mdi-email", link: "/EmailSetup"});
          }
          if (!disalbeMenuItems.includes("LDAP")) {
            items.push({ title: this.$t("Active Directory"), icon: "mdi-microsoft" , link: "/LDAP" });
          }
        }
        if (!disalbeMenuItems.includes("Admins")) {
          items.push({ title: this.$t("Administrators"), icon: "mdi-account-tie" , link: "/Admins" });
        }
        if (!disalbeMenuItems.includes("Security")) {
          items.push({ title: this.$t("Security"), icon: "mdi-shield-account", link: "/Security" });
        }
        if (appData.activePlugins.includes("session-monitor")) {
          if (!disalbeMenuItems.includes("SessionMonitor")) {
            items.push({ title: this.$t("Session Monitor"), icon: "mdi-memory", link: "/SessionMonitor" });
          }
        }
      }
      if (appData.isEnterpriseEdition() && appData.checkPermission("/reports","r") && !disalbeMenuItems.includes("Reports")) {
        items.push({ title: this.$t("Reports"), icon: "mdi-file-document-multiple-outline" , link: "/Reports"});
      }

      let customMenuItems = plugins.getCustomMenuItems(appData);
      for (let i=0;i<customMenuItems.length;i++) {
        items.push(customMenuItems[i]);
      }
      this.menuItems = items;
    },
    retryConnection() {
      this.networkErrorDialog = false;
      this.checkLoginLoop(this.currentLoginToken, true);
    },

    // Chatbot toggle method
    toggleChatbot() {
      this.chatbotDrawer = !this.chatbotDrawer;
      // Save state to localStorage
      localStorage.setItem('chatbotOpen', this.chatbotDrawer ? 'true' : 'false');
    }
  },
  watch: {
    // Watch for changes in activePlugins to close chatbot if session-monitor is removed
    'appData.activePlugins': {
      handler(newPlugins) {
        if (this.chatbotDrawer && !newPlugins.includes('session-monitor')) {
          this.chatbotDrawer = false;
          localStorage.setItem('chatbotOpen', 'false');
        }
        this.updatePermissions();
      },
      deep: true
    }
  },
  created: function () {
    // Load chatbot open state from localStorage
    const chatbotState = localStorage.getItem('chatbotOpen');
    if (chatbotState !== null) {
      this.chatbotDrawer = chatbotState === 'true';
    }

    // Initialize global app state for chatbot context with minimal information
    window.$nuboAppState = {
      timestamp: new Date().toISOString()
    };

    // loading locale
    const userLocale =
    navigator.languages && navigator.languages.length
      ? navigator.languages[0]
      : navigator.language;

    if (userLocale) {
      console.log(`Detected locale:  ${userLocale}`); //
      this.$i18n.locale = userLocale;
    } else {
      console.log(`User locale not detected`); //
    }

    console.log(`this.appData.isAuthenticated: ${this.appData.isAuthenticated}`);
    if (this.appData.isAuthenticated) {
      this.items = [{
        text: appData.productName,
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
