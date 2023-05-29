const multer = require('multer');

const storage = multer.memoryStorage();

exports.mediaUpload = multer({ storage: storage }).array('file')


