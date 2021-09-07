const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

const defaultText = `{
    "customData": {
        "maxTrackId": 0,
        "regions": [],
        "maxTrackIdList": [0],
        "currentTrackId": []
    },
    "frameData": {}
}`;

const defaultPictureText = `{
    "path": "",
    "files": [],
    "labels": [],
    "fileNameMap": {},
    "pictureResult": {},
    "fullName": "",
    "currentEditingIndex": -1,
    "unTagedRegionsIndex": []
}`;

class FileService {
    removeAttach() {
        ipcMain.off('save_project_file', this.saveProjectFileCb);
        ipcMain.off('read_project_file', this.readProjectFileCb);
        ipcMain.off('read_pictures', this.readPicturesCb);
        ipcMain.off('read_file', this.readFileCb);
    }

    attch() {
        ipcMain.on('save_project_file', this.saveProjectFileCb);
        ipcMain.on('read_project_file', this.readProjectFileCb);
        ipcMain.on('read_pictures', this.readPicturesCb);
        ipcMain.on('read_file', this.readFileCb);
    }

    readText(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.normalize(filePath), (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve(data.toString());
            });
        });
    }

    readBinary(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.normalize(filePath), (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    }

    writeBinary(filePath, contents) {
        return new Promise((resolve, reject) => {
            const containerName = path.normalize(path.dirname(filePath));
            const exists = fs.existsSync(containerName);
            if (!exists) {
                fs.mkdirSync(containerName);
            }

            fs.writeFile(path.normalize(filePath), contents, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    writeText(filePath, contents) {
        const buffer = Buffer.from(contents);
        return this.writeBinary(filePath, buffer);
    }

    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            const exists = fs.existsSync(path.normalize(filePath));
            if (!exists) {
                resolve();
            }

            fs.unlink(filePath, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    saveProjectFileCb = (event, arg) => {
        console.log(arg.path);
        const path = arg.path;
        const topic = arg.topic;
        const contents = arg.contents;
        this.writeText(path, contents).then(() => {
            event.reply(topic, contents);
        });
    };

    readProjectFileCb = (event, arg) => {
        const { path, name, topic } = arg;
        const file = `${path}${name.split('.')[0]}.vt`;
        if (fs.existsSync(file)) {
            this.readText(file).then((data) => {
                event.reply(topic, data);
            });

            return;
        }

        this.writeText(file, defaultText).then(() => {
            event.reply(topic, defaultText);
        });
    };

    readFileCb = (event, arg) => {
        const { path, topic } = arg;
        this.readText(path).then((data) => {
            event.reply(topic, data);
        });
    };

    readPicturesCb = (event, arg) => {
        const { path, name, files, topic } = arg;
        const file = `${path}${name}`;
        if (fs.existsSync(file)) {
            this.readText(file).then((data) => {
                event.reply(topic, data);
            });

            return;
        }

        const targetFileList = files.map((file, index) => {
            const { width, height } = sizeOf(file.path);
            return {
                path: file.path,
                width,
                height,
                id: index + 1,
                name: file.name,
            };
        });

        console.log(targetFileList, '???????????');

        const projectData = {
            dateCaptureTime: this.getTime(),
            path,
            files: targetFileList,
            labels: [],
            fileNameMap: {},
            pictureResult: {},
            fullName: files.map((file) => file.name.split('.')[0]).join(''),
            currentEditingIndex: 0,
            unTagedRegionsIndex: [],
        };

        console.log(projectData);

        this.writeText(file, JSON.stringify(projectData)).then(() => {
            event.reply(topic, JSON.stringify(projectData));
        });
    };

    getTime = () => {
        const date = new Date();
        const year = date.getFullYear() + '';
        const month = (date.getMonth() + 1 + '').padStart(2, '0');
        const day = (date.getDate() + '').padStart(2, '0');
        const hour = (date.getHours() + '').padStart(2, '0');
        const min = (date.getMinutes() + '').padStart(2, '0');
        const sec = (date.getSeconds() + '').padStart(2, '0');

        // tslint:disable-next-line:max-line-length
        return {
            year,
            month,
            day,
            hour,
            min,
            sec,
        };
    };
}

module.exports = new FileService();
