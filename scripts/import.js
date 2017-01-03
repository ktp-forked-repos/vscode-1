const cson = require('cson');
const fs = require('fs');
const execSync = require('child_process').execSync;
const parameterize = require('parameterize');
const util = require('util');
const genex = require('genex');
const ret = require('ret');

const path = './defs';
const repo = 'https://github.com:DanBrooker/file-icons';
const defs = cson.parseCSFile(path + '/config.cson');
const stylesIcons = fs.readFileSync(path + '/styles/icons.less').toString();
const darkFontColour = "#ffffff";
const lightFontColour = "#000000";
// console.log("icons file: ", stylesIcons);

var icons = {};
var result;

let regex = /\.(.*?)-icon:before\s+{\s+\.(\w+); content: "(.*?)"/g;
let fontMap = {
    "fi": "file-icons",
    "fa": "fontawesome",
    "octicons": "octicons",
    "mf": "mfixx",
    "devicons": "devicons"
}
while ((match = regex.exec(stylesIcons)) !== null) {
    // console.log(match)
    let name = "_" + match[1];
    let font = match[2];
    let character = match[3];
    icons[name] = {
        'fontCharacter': character,
        'fontColor': darkFontColour,
        'fontId': fontMap[font]
    };
    icons[name + "_l"] = {
        'fontCharacter': character,
        'fontColor': lightFontColour,
        'fontId': fontMap[font]
    };
}

execSync("git submodule init; git submodule update")

let fonts = Object.values(fontMap).map(function (name){
    return {
        "id": name,
        "src": [
            {
                "path": "./" + name +".woff2",
                "format": "woff2"
            }
        ],
        "weight": "normal",
        "style": "normal",
        "size": "100%"
    };
});

var extensions = {}, extensions_l = {};
var files = {}, files_l = {};

let colourMap = {
    // Red
    "medium-red": "#ac4142",
    "light-red": "#c97071",
    "dark-red": "#c97071",
    // Green
    "medium-green": "#90a959",
    "light-green": "#b2c38b",
    "dark-green": "#66783e",
    // Yellow
    "medium-yellow": "#f4bf75",
    "light-yellow": "#fae0bc",
    "dark-yellow": "#ee9e2e",
    // Blue
    "medium-blue": "#6a9fb5",
    "light-blue": "#9dc0ce",
    "dark-blue":  "#46788d",
    // Maroon
    "medium-maroon": "#8f5536",
    "light-maroon": "#be7953",
    "dark-maroon":  "#573421",
    // Purple
    "medium-purple": "#aa759f",
    "light-purple": "#c7a4c0",
    "dark-purple": "#825078",
    // Orange
    "medium-orange": "#d28445",
    "light-orange": "#e1ad83",
    "dark-orange":  "#a35f27",
    // Cyan
    "medium-cyan": "#75b5aa",
    "light-cyan": "#a7d0c9",
    "dark-cyan":  "#4d9085",
    // Pink
    "medium-pink": "#ff00cc",
    "light-pink": "#ff4ddb",
    "dark-pink":  "#b3008f",
};

function parseRegex(regex) {
    // let tokens = ret(regex.source);
    var gen = [];
    try {
        let count = genex(regex).count();
    
        if (count <= 1000) {
            genex(regex).generate(function (output) {
                // console.log('[*] ' + output);
                gen.push(output);
            });
        } else {
            console.log(regex + " skipped regex has too many cases to generate: " + count);
        }
    } catch(exception) {
        console.log(regex + "skipped regex caused an error: " + exception);
    }

    return gen;
}

function process(hash) {
    let match = hash.match;
    let icon = hash.icon;
    let colour = hash.colour;

    if(match instanceof Array) {
        for(var m = 0; m < match.length; m++) {

            let nested = match[m];
            
            var ext = nested[0];
            let colour = nested[1]; // TODO do something with this colour

            if(ext instanceof RegExp) {

                let darkColour = colourMap[colour];
                if(darkColour && icons["_" + icon]) {
                    icons["_" + icon].fontColor = darkColour;
                }

                console.log("regexp " + util.inspect(ext));
                let exts = parseRegex(ext);
                for(var i = 0; i < exts.length; i++) {
                    let ext = exts[i];
                    if(ext.startsWith(".")) {
                        extensions[ext.substring(1)] = "_" + icon;
                        extensions_l[ext.substring(1)] = "_" + icon + "_l";
                    } else {
                        files[ext] = "_" + icon;
                        files_l[ext] = "_" + icon + "_l";
                    }
                    console.log(ext + " => " + icon);
                }
            } else if(typeof(ext) === "string") {
                console.log("string " + util.inspect(ext));

                let darkColour = colourMap[colour];
                if (darkColour && icons["_" + icon]) {
                    icons["_" + icon].fontColor = darkColour;
                }

                if(ext.startsWith(".")) {
                    extensions[ext.substring(1)] = "_" + icon;
                    extensions_l[ext.substring(1)] = "_" + icon + "_l";
                } else {
                    files[ext] = "_" + icon;
                    files_l[ext] = "_" + icon + "_l";
                }
                console.log(ext + " => " + icon);
            } else {
                console.log("skipped " + ext);
            }
        }
    } else if(match instanceof RegExp) {
        let exts = parseRegex(match);

        let darkColour = colourMap[colour];
        if (darkColour && icons["_" + icon]) {
            icons["_" + icon].fontColor = darkColour;
        }

        for(var i = 0; i < exts.length; i++) {
            let ext = exts[i];
            if(ext.startsWith(".")) {
                extensions[ext.substring(1)] = "_" + icon;
                extensions_l[ext.substring(1)] = "_" + icon + "_l";
            } else {
                files[ext] = "_" + icon;
                files_l[ext] = "_" + icon + "_l";
            }
            console.log(ext + " => " + icon);
        }
    } else if(typeof(match) === "string") {
        if(match.startsWith('.')) {
            let darkColour = colourMap[colour];
            if (darkColour && icons["_" + icon]) {
                icons["_" + icon].fontColor = darkColour;
            }

            extensions[match.substring(1)] = "_" + icon;
            extensions_l[match.substring(1)] = "_" + icon + "_l";
            console.log(match + " => " + icon);
        } else {
            console.log(match+ " skipped not a file extension");
        }
    } else {
        console.log(match+ " skipped type");
    }
}

for(let fileIcon in defs.fileIcons ) {
    process(defs.fileIcons[fileIcon]);
}

for(let directoryIcon in defs.directoryIcons) {
    process(defs.directoryIcons[directoryIcon]);
}

var languages = [];

// export file-icon-theme.json
var root = {};
root.fonts = fonts;
root.iconDefinitions = icons;
root.file = '_default';
root.folder = "_folder";
root.folderExpanded = "_folder_open";
root.fileExtensions = extensions;
root.fileNames = files;
root.languageIds = languages;
root.light = {
    "file": '_default',
    "folder": "_folder_l",
    "folderExpanded": "_folder_open_l",
    "fileExtensions": extensions_l,
    "fileNames": files_l
};
root.version = ("https://github.com/file-icons/vscode/commit/" + execSync('git rev-parse HEAD')).replace(/\n$/, '');

let json = JSON.stringify(root, null, 2);
fs.writeFile('./icons/file-icons-theme.json', json, function() {});