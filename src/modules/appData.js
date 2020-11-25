import { v4 as uuidv4 } from 'uuid';
import Bowser from "bowser";

const production = process.env.NODE_ENV === 'production' ? true : false;

const appData = {

    // configuration
    //postURL: "/",
    postURL: production ? "/" : "http://labil.nubosoftware.com:8080/",
    proxyURL: production ? null : "http://127.0.0.1:9080/", //"http://localhost:9080/",

    // loaded users params
    isAuthenticated: false,
    appName: "Control Panel Test",
    adminLoginToken: "",
    mainDomain: "",
    firstname: "",
    lastname: "",
    imageurl: "",
    email: "",
    orgname: "",
    deviceid: "",
    deviceName: "",
    activationkey: "",
    orgs: [],

    // additional data
    moduleName: "",

    commit: () => {
        localStorage.setItem("isAuthenticated", appData.isAuthenticated);
        localStorage.setItem("adminLoginToken", appData.adminLoginToken);
        localStorage.setItem("mainDomain", appData.mainDomain);
        localStorage.setItem("firstname", appData.firstname);
        localStorage.setItem("lastname", appData.lastname);
        localStorage.setItem("imageurl", appData.imageurl);
        localStorage.setItem("email", appData.email);
        localStorage.setItem("orgname", appData.orgname);
        localStorage.setItem("orgs", JSON.stringify(appData.orgs));
        localStorage.setItem("deviceid", appData.deviceid);
        localStorage.setItem("deviceName", appData.deviceName);
        localStorage.setItem("activationkey", appData.activationkey);

    },
    load: () => {
        console.log("Loading app data..");
        appData.isAuthenticated = localStorage.getItem("isAuthenticated");
        appData.adminLoginToken = localStorage.getItem("adminLoginToken");
        appData.mainDomain = localStorage.getItem("mainDomain");
        appData.firstname = localStorage.getItem("firstname");
        appData.lastname = localStorage.getItem("lastname");
        appData.imageurl = localStorage.getItem("imageurl");
        appData.email = localStorage.getItem("email");
        appData.orgname = localStorage.getItem("orgname");
        let orgsStr = localStorage.getItem("orgs");
        if (orgsStr && orgsStr != "") {
            try {
                appData.orgs = JSON.parse(orgsStr);
            } catch (err) {
                console.log(err);
            }
        }
        appData.deviceid = localStorage.getItem("deviceid");
        if (!appData.deviceid || appData.deviceid == "") {
            appData.deviceid = uuidv4();
            localStorage.setItem("deviceid", appData.deviceid);
            //console.log("appData.deviceid: " + appData.deviceid);
        }

        appData.deviceName = localStorage.getItem("deviceName");
        if (!appData.deviceName || appData.deviceName == "") {
            let parsedUserAgent = Bowser.parse(navigator.userAgent);
            appData.deviceName = `${parsedUserAgent.browser.name}`;
            localStorage.setItem("deviceName", appData.deviceName);
            console.log(`deviceName: ${appData.deviceName}`);
        }
        appData.activationkey = localStorage.getItem("activationkey");
        console.log(`Admin: ${appData.email}`);
    },
    logout: () => {
        appData.isAuthenticated = false;
        appData.adminLoginToken = "";
        appData.mainDomain = "";
        appData.firstname = "";
        appData.lastname = "";
        appData.imageurl = "";
        //appData.email = "";
        appData.orgname = "";
        //appData.activationkey = "";
        appData.commit();
    }
};


appData.load();

export default appData