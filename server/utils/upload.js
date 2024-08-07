const multer = require('multer');

const uploadPicture = (req, res, pildiPath) => {
  // sätime paika fili nime ja asukoha
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, pildiPath);
    },
    filename: (req, file, cb) => {
      const ext = file.originalname.substring(
        file.originalname.lastIndexOf('.'),
        file.originalname.length
      );
      cb(null, `${Date.now()}${ext}`);
    },
  });
  const upload = multer({ storage }).single('pilt'); // Store the middleware

  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        console.log(err, 'Upload error');
        reject(err);
      }
      resolve(true);
    });
  });
};
// laeme pildi üles, eelnimetatud kausta ja nimega
/* const uploadPicture = (pildiPath) => {
  // sätime paika fili nime ja asukoha
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, pildiPath);
    },
    filename: (req, file, cb) => {
      const ext = file.originalname.substring(
        file.originalname.lastIndexOf('.'),
        file.originalname.length
      );
      cb(null, `${Date.now()}${ext}`);
    },
  });
  return multer({ storage }).single('pilt');
}; */

module.exports = uploadPicture;
