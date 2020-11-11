const appData = {

    // configuration
    postURL: "http://labil.nubosoftware.com:8080/",
    proxyURL: "http://127.0.0.1:9080/", //"http://localhost:9080/",

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
        console.log(`Admin: ${appData.email}`);
    },
    logout: () => {
        appData.isAuthenticated = false;
        appData.adminLoginToken = "";
        appData.mainDomain = "";
        appData.firstname = "";
        appData.lastname = "";
        appData.imageurl = "";
        appData.email = "";
        appData.orgname = "";
        appData.commit();
    }
};


appData.load();

export default appData