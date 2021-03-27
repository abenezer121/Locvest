const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const { google } = require('googleapis');
const app = express();
const { Readable } = require('stream');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const { loadFunc } = require('./drivecode')
const imagemin = require('imagemin')
const fs = require('fs')
const isJpg = require('is-jpg')
const sharp = require('sharp')
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : path.join(__dirname,'tmp'),
}));


function bufferToStream(binary) {

    const readableInstanceStream = new Readable({
            read() {
                    this.push(binary);
                    this.push(null);
            }
    });

    return readableInstanceStream;
}


const convertToJpg = async(input) => {

    if (isJpg(input)) {
            return input;
    }

    return sharp(input)
            .jpeg()
            .toBuffer();
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const readFile = (name) => {
    return fs.readFileSync(name);
}

let load = async(name) => {
    let buffer = readFile(name)

    const miniBuffer = await imagemin.buffer(buffer, {
            plugins: [convertToJpg, imageminMozjpeg({ quality: 60 })]
    });
    return miniBuffer;

}


app.post('/uploadtodrive' , async  (req , res)=>{

    let drive = loadFunc()
    let FolderId = "1hVXE47fxTVUU9AuLo3znQRoHHy6I6noQ";
     async function uploadToFolder(auth) {
                                const drive = google.drive({ version: 'v3', auth })
                                // find the store here 
                                var folderId = FolderId;
                                var fileMetadata = {
                                        'name': 'photo.jpg',
                                        parents: [folderId]
                                };
                                //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                                let avatar = req.files.file;
                                //Use the mv() method to place the file in upload directory (i.e. "uploads")
                                await avatar.mv('./uploads/' + avatar.name);

                                let data = await load('./uploads/' + avatar.name)



                                var media = {
                                        mimeType: 'image/jpeg',
                                        body: bufferToStream(data)
                                };

                                let file = await drive.files.create({
                                        resource: fileMetadata,
                                        media: media,
                                        fields: 'id'
                                });

                                return file.data.id
                        }
                        try{
                            let imageid = await uploadToFolder(drive);
                            //image uploaded
                            console.log("image uploaded")
                            console.log(imageid)
                        }
                        catch(err)
                        {
                            console.log(err)
                        }
                     

})
app.post('/', (req, res) => {
    
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    console.log(req.body)

    // Accessing the file by the <input> File name="target_file"
    let targetFile = req.files.target_file;
  

    //mv(path, CB function(err))
    targetFile.mv(path.join(__dirname + "/upload", targetFile.name), (err) => {
        if (err)
            return res.status(500).send(err);
        res.send('File uploaded!');
    });
  
});

app.get('/senddata' , function(req , res){

})


app.listen(3000, () => console.log('Your app listening on port 3000'));