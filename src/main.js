import Vue from 'vue'
import App from './App.vue'
import vuetify from './vuetify';
//import Vuetify from 'vuetify/lib'

import initRouter from './router'
import plugins from './plugins'
import i18n from './i18n'
import VueNotification from "@kugatsu/vuenotification";


Vue.config.productionTip = false
    //Vue.use(require("moment"));
Vue.use(VueNotification, {
    timer: 20,
    warning: {
        background: "#cc974c",
        color: "white"
    },
    error: {
        background: "#b93e2d",
        color: "white"
    },
    success: {
        background: "#697d41",
        color: "white"
    }
});

// import plugin from './plugins/plugin_test/main.js'
// plugin.initPlugin();
// let pluginsRoutes = plugin.routes;
let router = initRouter(plugins.pluginsRoutes);

new Vue({
    vuetify,
    router,
    i18n,
    render: h => h(App)
}).$mount('#app')