/**
 * Created by enpfeff on 2/27/17.
 */
const P = require('bluebird');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const readDir = P.promisify(fs.readdir);
const AWS = require('aws-sdk');
let s3 = null;
module.exports = entry;

// where the UI is being built
const BUILD_DIR = 'dist';
// where should prod deploy to
const BUCKET_NAME_PROD = 'enpfeff.com';
// where should dev deploy to
const BUCKET_NAME_DEV = 'enpfeff.com';
// output crap
const PRETTY_PRINT_SPACER = '\n\t*  ';
// mime types map
const CONTENT_TYPE_MAP = {
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.png': 'image/png',
    '.gif': 'image/gif',
    'jpeg': 'image/jpeg'
};
// how do you want caching to work
const CACHE_CONTROL_MAP = {
    '.html': 'max-age=0, must-revalidate'
};

if(require.main === module) entry();

function entry() {
    loadEnvironment();

    AWS.config = new AWS.Config({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    s3 = new AWS.S3({apiVersion: '2006-03-01'});

    return getAndUploadDistribution('./ui');
}

function loadEnvironment() {
    // used in development so i dont share aws secrets
    const ENV_FILE = path.resolve(path.join(__dirname, '..', 'env.js'));

    // not in development env
    if(!fs.existsSync(ENV_FILE)) return;
    console.log('Found Env file loading environment');

    const ENV = require(ENV_FILE);
    _.each(ENV, (v, k) => process.env[k] = v);
}

function getAndUploadDistribution(uiDir, branch) {
    const dirname = uiDir;
    const branchName = !branch ? getBranchName() : branch;
    const isProd = branchName === 'prod';

    // if its prod then we are pushing to whatever is in the meta of the package json
    const bucketName = isProd ? BUCKET_NAME_PROD : BUCKET_NAME_DEV;
    const directoryPath = `${dirname}/${BUILD_DIR}`;

    console.log(`Bucket Name: ${bucketName}`);
    // first we want to remove all items in the bucket
    return removeItems(bucketName)
        .then(() => uploadDir(directoryPath));

    function logFiles(files) {
        let prettyFiles = _.clone(files);
        prettyFiles[0] = PRETTY_PRINT_SPACER + prettyFiles[0];
        prettyFiles = prettyFiles.join(PRETTY_PRINT_SPACER);
        console.log(`Attempting to upload to ${bucketName}: ${prettyFiles}`);
        return files;
    }

    function uploadDir(aPath) {
        return readDir(aPath)
            .then(logFiles)
            .then(files => {
                return P.map(files, file => {
                    file = path.join(aPath, file);

                    if(fs.lstatSync(file).isDirectory()) return uploadDir(file);
                    return uploadFile(file);
                });
            });
    }

    function uploadFile(fullFilePath) {
        const uploadKey = fullFilePath.substring(fullFilePath.indexOf(BUILD_DIR) + 5);

        const readStream = fs.createReadStream(fullFilePath);
        readStream.on('error', (d) => console.log(d.toString()));

        return new P((resolve, reject) => {
            s3.upload({
                Bucket: bucketName,
                Key: uploadKey,
                Body: readStream,
                ContentType: getContentType(fullFilePath),
                CacheControl: getCacheControl(fullFilePath)
            }, (err, data) => {
                if(err) {
                    console.log('Error', err);
                    return reject(err);
                }
                if(data) console.log('Upload Success', data.Location);
                return resolve();
            });
        });
    }
}


function removeItems(bucketName) {
    return new P((resolve, reject) => {
        s3.listObjectsV2({Bucket: bucketName}, (err, data) => {
            if(err) {
                console.log('Error in bucket listing', err.message);
                return reject(err);
            }

            console.log(`Deleting from ${bucketName}`);

            const params = {
                Bucket: bucketName,
                Delete: {
                    Objects: _.compact(_.map(data.Contents, (content) => {
                        const key = _.get(content, 'Key');
                        if(_.isUndefined(key)) return;
                        console.log(`\t*  ${key}`);
                        return { Key: key };
                    }))
                }
            };

            if(_.isEmpty(params.Delete.Objects)) return resolve();

            // now that we have all the object go and delete them
            s3.deleteObjects(params, (err, data) => {
                if(err) {
                    console.log('Error in bucket removing', err.message);
                    return reject(err);
                }
                return resolve();
            });
        });
    });
}

function getCacheControl(file) {
    let cache = CACHE_CONTROL_MAP[path.extname(file)];
    // default is 30 days
    if(_.isUndefined(cache)) cache = 'max-age=2592000, must-revalidate';
    return cache;
}

function getContentType(file) {
    return CONTENT_TYPE_MAP[path.extname(file)];
}

// this is specially passed in for the build
function getBranchName() {
    let branch = process.argv[2];
    if(_.isUndefined(branch)) {
        console.log(`Deploy target is undefined reverting to "dev"`);
        branch = 'dev';
        return branch;
    }

    console.log(`Deploy target is ${branch}`);
    return branch;
}
