const fs = require('fs');
const path = require('path');

async function main() {
    try {
        let t = JSON.parse(await fs.promises.readFile("./src/locales/en.json"));
        for (const [key, value] of Object.entries(t)) {
            if (key != value) {
                console.log(`${key}: ${value}`);
            } else {
                delete t[key];
            }

        }
        //return;
        let dir = "./src/views/";
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
            console.log(file);
            let s = await fs.promises.readFile(path.join(dir, file), "utf8");
            //console.log(content);
            let re = /\$t\([\"\']([^\"\']+)[\"\']\)/g;
            do {
                m = re.exec(s);
                if (m) {
                    //console.log(m[1]);
                    if (!t[m[1]]) {
                        t[m[1]] = m[1];
                    }
                }
            } while (m);
        }
        console.log(JSON.stringify(t, null, 2));
    } catch (err) {
        console.log(err);
    }
}




main();