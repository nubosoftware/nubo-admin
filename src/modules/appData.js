const appData = {

    // configuration
    postURL: "http://labil.nubosoftware.com:8080/",
    proxyURL: "http://localhost:9080/",

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