const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const defaultText = `{
    "customData": {
        "maxTrackId": 0,
        "regions": [],
        "maxTrackIdList": [0],
        "currentTrackId": []
    },
    "frameData": {}
}`;

class FileService {

    removeAttach() {
        ipcMain.off('save_file', this.saveFileCb);
        ipcMain.off('read_file', this.readFileCb);
    }

    attch() {
        ipcMain.on('save_file', this.saveFileCb);
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

    saveFileCb = (event, arg) => {
        const { filePath, fileName } = arg.path;
        const contents = arg.contents;
        this.writeText(`${filePath}${fileName.split('.')[0]}.vt`, contents)
            .then(() => {
                event.reply('file_save', 'file saved')
            });
    }

    readFileCb = (event, arg) => {
        const { path, name } = arg;
        const file = `${path}${name.split('.')[0]}.vt`;
        if (fs.existsSync(file)) {
            this.readText(file)
                .then((data) => {
                    event.reply('file_read', data)
                });

            return;
        }

        this.writeText(file, defaultText)
            .then(() => {
                event.reply('file_read', defaultText)
            })
    }
}

module.exports = new FileService();



