var fs = require('fs');
var mime = require('mime-types')
var Zip = require("adm-zip");
var path = require('path');

function readFiles(dirname, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    
    console.log(path.resolve(path.join(dirname, filenames[0])))
  });
}

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What do you want to name the file? ', function (name) {
    console.log(`${name} is our user`);
    readFiles("Upload");
    rl.close();
});



// var zip = new Zip();

// zip.addLocalFolder("Copy");
// zip.writeZip("Content.zip");



const fs = require('fs');
const { google } = require('googleapis');
var mimeTypes = require('mime-types');
const path = require('path');
var Zip = require("adm-zip");

const KEYFILEPATH = './file.json';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Create a service account initialize with the service account key file and scope needed
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

async function createAndUploadFile(filePath, name) {
    const driveService = google.drive({version: 'v3', auth});

    let mime = mimeTypes.lookup(filePath);
    let fileName = name + path.extname(filePath);

    let fileMetadata = {
        'name' : `${fileName}`,
        'parents' : ['1X0MuJIWaJiIuBDKxzcSRzMi38aqtcViP']
    }

    let media = {
        mimeType: `${mime}`,
        body: fs.createReadStream(filePath)
    };

    let response = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        supportsTeamDrives: true
    });

    switch(response.status){
        case 200:
            let file = response.result;
            console.log('Created File Id: ', response.data.id);
            // console.log(response);
            generatePublicUrl(response.data.id)

            // Delete all files after completion
            fs.unlink(filePath, (err) => {
                if (err) throw err;
            });
            break;
        default:
            console.error('Error creating the file, ' + response.errors);
            break;
    }
}


async function generatePublicUrl(fileId) {
    try {
      const driveService = google.drive({version: 'v3', auth});
      await driveService.permissions.create({
        fileId: fileId,
        supportsTeamDrives: true,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
  
      /* 
      webViewLink: View the file in browser
      webContentLink: Direct download link 
      */
      const result = await driveService.files.get({
        fileId: fileId,
        fields: 'webViewLink, webContentLink',
        supportsTeamDrives: true,
      });
      console.log(result.data.webContentLink);
      copy(result.data.webContentLink);
    } catch (error) {
      console.log(error.message);
    }
  }

function readFiles(dirname, uploadName, onError) {
    fs.readdir(dirname, async function(err, filenames) {
      if (err) {
        onError(err);
        return;
      }

      if(filenames.length == 0){
        console.log('UPLOAD Folder is Empty!!! Kindly Check...');
        await sleep(5000);
        return;
      }
      
      if(filenames.length > 1){
        if(uploadName){
            uploadName = uploadName;
        } else{
            uploadName = "Content";
        }

        var zip = new Zip();
        zip.addLocalFolder("Upload");
        zip.writeZip(`${uploadName}.zip`);

        // Delete all files after compressing
        fs.readdir(directory = 'Upload', (err, files) => {
            if (err) throw err;
          
            for (const file of files) {
              fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err;
              });
            }
        });

        let absPath = path.resolve(`${uploadName}.zip`);
        createAndUploadFile(absPath, uploadName);
      } else{
        absPath = path.resolve(path.join(dirname, filenames[0]));
        if(uploadName){
            uploadName = uploadName;
        } else{
            var extension = path.extname(absPath);
            var file = path.basename(absPath, extension);

            uploadName = file;
        }
        createAndUploadFile(absPath, uploadName);
      }
    });
}

const readline = require('readline');
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

rl.question('What do you want to name the file?:    ', function (name) {
    readFiles("Upload", name);
    rl.close();
});

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

function copy(text){
    const { exec } = require("child_process");

    text = text.replace(/([&])/g, "^&")
    let commandOne = "cd Copy"; 
    let commandTwo = `node copy.js ${text}`; 

    exec(`${commandOne} && ${commandTwo}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
}
