const multer = require('multer');

// laeme pildi üles, eelnimetatud kausta ja nimega
const upload = (pildiPath) => {
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
};

module.exports = upload;
