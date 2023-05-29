const DataUriParset = require('datauri/parser');
const path = require('path');
/*The main function provided by the datauri package is used to parse data and generate Data URIs. When you pass a file or data to this function, it will analyze the input and convert it into a Data URI format.*/
exports.getDataUri = (file) => {
    const parset = new DataUriParset();
    const extName = path.extname(file.originalname).toString();
    return parset.format(extName, file.buffer);
}