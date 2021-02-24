//https://connect.garmin.com/modern/connections/feed
const axios = require('axios');
const fsPromises = require('fs').promises;
const fs = require('fs');
const extract = require('extract-zip')



/*var argv = require('optimist')
    .usage('Usage: $0  [options]')
    .demand(['url'])
    .describe('data', 'Post data in JSON format')
    .describe('method', 'HTTP method (default is get)')
    .string('url')
    .string('method')
    .string('data')
    .argv;*/

/*

:authority: connect.garmin.com
:method: GET
:path: /modern/connections/feed
:scheme: https
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng, ;
q = 0.8, application / signed - exchange;
v = b3;
q = 0.9
accept - encoding: gzip, deflate, br
accept - language: en - GB, en;
q = 0.9, ko - KR;
q = 0.8, ko;
q = 0.7, he - IL;
q = 0.6, he;
q = 0.5, en - US;
q = 0.4
cache - control: no - cache
cookie: _ga = GA1 .2 .342934086 .1602490831;
GARMIN - SSO = 1;
GarminNoCache = true;
GARMIN - SSO - GUID = 9681 FE71B6D55760B104FB83F5E0906F7CC88E1B;
GARMIN - SSO - CUST - GUID = 80e68 cb1 - e6fd - 44e d - 97e2 - aeef80f28e65;
G_ENABLED_IDPS = google;
notice_behavior = none;
_hjid = 3180 cc33 - 3 c34 - 4 b0f - 8509 - 665431 a5f74e;
__cfduid = d079c06af87a9bd9b6f913ce87953c9f51609577963;
__cflb = 02 DiuJLbVZHipNWxN8xjNziif9XwiLsQePonnJUCJFnnY;
_gid = GA1 .2 .1369797285 .1609577968;
CONSENTMGR = consent: true % 7 Cts: 1609578351263;
utag_main = v_id: 01751 be58e0d0011fad50cc6b2bd03079001b0710093c$_sn: 2 $_ss: 0 $_st: 1609580151269 $ses_id: 1609577968091 % 3 Bexp - session$_pn: 3 % 3 Bexp - session;
notice_behavior = none;
SESSIONID = fd39c072 - af45 - 4022 - 819e-3 ba9ec3569f0
pragma: no - cache
sec - ch - ua: "Google Chrome";
v = "87", " Not;A Brand";
v = "99", "Chromium";
v = "87"
sec - ch - ua - mobile: ? 0
sec - fetch - dest: document
sec - fetch - mode: navigate
sec - fetch - site: none
sec - fetch - user: ? 1
upgrade - insecure - requests: 1
user - agent:

    */


async function waitForStream(stream) {
    return new Promise(function(resolve, reject) {
        stream.on('end', () => {
                console.log("Stream ended!");
                resolve(stream);
            })
            .on('error', reject);
    });
}

async function downloadActivity(activityID) {
    let cookie = " _ga=GA1.2.342934086.1602490831; GARMIN-SSO=1; GarminNoCache=true; GARMIN-SSO-GUID=9681FE71B6D55760B104FB83F5E0906F7CC88E1B; GARMIN-SSO-CUST-GUID=80e68cb1-e6fd-44ed-97e2-aeef80f28e65; G_ENABLED_IDPS=google; notice_behavior=none; _hjid=3180cc33-3c34-4b0f-8509-665431a5f74e; __cfduid=d079c06af87a9bd9b6f913ce87953c9f51609577963; __cflb=02DiuJLbVZHipNWxN8xjNziif9XwiLsQePonnJUCJFnnY; _gid=GA1.2.1369797285.1609577968; CONSENTMGR=consent:true%7Cts:1609578351263; utag_main=v_id:01751be58e0d0011fad50cc6b2bd03079001b0710093c$_sn:2$_ss:0$_st:1609580151269$ses_id:1609577968091%3Bexp-session$_pn:3%3Bexp-session; notice_behavior=none; SESSIONID=fd39c072-af45-4022-819e-3ba9ec3569f0";
    let response = await axios({
        method: "get",
        responseType: 'stream',
        headers: {
            Cookie: cookie
        },
        url: `https://connect.garmin.com/modern/proxy/download-service/files/activity/${activityID}`,
        //url: "https://connect.garmin.com/modern/proxy/download-service/files/activity/6038975386",
        //url: "https://connect.garmin.com/modern/connections/feed",
        /*data: {
            userName: settings.username,
            password: settings.password,
            deviceid: "APITest",
            deviceName: "API",
            activationkey: settings.activationkey //"0837e76290cf554edd2203d24702c83e7c7d3f538fc61e6025d586c31bf43db72d2961331819b7bd2f4453cdd0b04c73"
        }*/
    });
    //console.log(response.status);
    //console.log(response.headers);
    let stream = fs.createWriteStream(`./activities/${activityID}.zip`);

    await response.data.pipe(stream);

    //let res = await waitForStream(stream);
    console.log("Finished write file...");

    //await fsPromises.writeFile(`./activities/${activityID}.zip`, response.data);
}


async function main() {
    try {




        /*let html = await fsPromises.readFile("garmin1.html", "utf8");
        const regexp = /"\/modern\/activity\/([0-9]*)"/g;
        const it = html.matchAll(regexp);

        let result = it.next();
        while (!result.done) {
            console.log("val: " + result.value);
            await downloadActivity(result.value[1]);
            result = it.next();
        }*/

        let files = await fsPromises.readdir("./activities/");
        for (let i = 0; i < files.length; i++) {
            let file = "./activities/" + files[i];
            if (file.endsWith(".zip")) {
                await extract(file, { dir: "/Users/israel/Documents/work/nubo/tmp/nubo-admin/api/activities/" });
            }
        }
        //console.log(files);

        //await downloadActivity("4714358477");
        //console.log("Downloaded activity..");
        //await fsPromises.writeFile("./garmin1.html", response.data);


        //
    } catch (err) {
        console.error(err);
    }
}



main();