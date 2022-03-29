import appData from "./appData";
import axios from "axios";

const appUtils = {


    req: (options) => {
        if (appData.postURL && appData.postURL != "") {
            options.url = appData.postURL + options.url;
        }
        if (appData.proxyURL && appData.proxyURL != "") {
            options.url = appData.proxyURL + options.url;
        }
        if (!options.method) {
            options.method = "get";
        }
        if (!options.headers) {
            options.headers = {};
        }
        if (appData.adminLoginToken && appData.adminLoginToken != "") {
            options.headers['Authorization'] = `OAuth ${appData.adminLoginToken}`;
        }
        return axios(options);
    },
    post: (options) => {
        options.method = "post";
        return appUtils.req(options);
    },
    get: (options) => {
        options.method = "get";
        return appUtils.req(options);
    },
    put: (options) => {
        options.method = "put";
        return appUtils.req(options);
    },
    delete: (options) => {
        options.method = "delete";
        return appUtils.req(options);
    },

    savePageData: (pageName,data,fields) => {
        let obj = {};
        for (const field of fields) {            
            obj[field] = data[field];
        }
        localStorage.setItem(`page_data_${pageName}`, JSON.stringify(obj));
        //console.log(`Save page: page_data_${pageName}: ${JSON.stringify(obj)}`);
    },

    loadPageData: (pageName,data) => {
        let str = localStorage.getItem(`page_data_${pageName}`);
        //console.log(`Load page page_data_${pageName}: ${str}`);
        if (str && str != "") {
            try {
                let obj = JSON.parse(str);
                for (const key in obj) {
                    data[key] = obj[key];
                }
            } catch (err) {
                console.log(err);
            }
        }
    },
}

export default appUtils