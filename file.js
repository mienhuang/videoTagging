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
        ipcMain.off('save_file', this.saveFileCb);
        ipcMain.off('read_file', this.readFileCb);
        ipcMain.off('read_pictures', this.readPicturesCb);
    }

    attch() {
        ipcMain.on('save_file', this.saveFileCb);
        ipcMain.on('read_file', this.readFileCb);
        ipcMain.on('read_pictures', this.readPicturesCb);
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

    saveFileCb = (event, arg) => {
        console.log(arg.path)
        const path = arg.path;
        const contents = arg.contents;
        this.writeText(path, contents).then(() => {
            event.reply('file_save', contents);
        });
    };

    readFileCb = (event, arg) => {
        const { path, name } = arg;
        const file = `${path}${name.split('.')[0]}.vt`;
        if (fs.existsSync(file)) {
            this.readText(file).then((data) => {
                event.reply('file_read', data);
            });

            return;
        }

        this.writeText(file, defaultText).then(() => {
            event.reply('file_read', defaultText);
        });
    };

    readPicturesCb = (event, arg) => {
        const { path, name, files } = arg;
        const file = `${path}${name}`;
        if (fs.existsSync(file)) {
            this.readText(file).then((data) => {
                event.reply('file_read', data);
            });

            return;
        }

        const targetFileList = files.map((file, index) => {
            const { width, height } = sizeOf(file.path);
            return {
                path: file.path,
                width,
                height,
                id: index,
                name: file.name,
            };
        });

        console.log(targetFileList, '???????????')

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

        console.log(projectData)

        this.writeText(file, JSON.stringify(projectData)).then(() => {
            event.reply('file_read', JSON.stringify(projectData));
        });
    };

    getTime = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1 + '';
        const day = date.getDate() + '';
        const hour = date.getHours() + '';
        const min = date.getMinutes() + '';
        const sec = date.getSeconds() + '';

        // tslint:disable-next-line:max-line-length
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}-${min.padStart(2, '0')}-${sec.padStart(
            2,
            '0'
        )}`;
    }
}

module.exports = new FileService();
