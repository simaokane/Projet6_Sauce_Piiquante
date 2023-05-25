/*
Cette configuration nous permet de gerer les fichier entrants
c'est à dire de chargement
*/
const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// on cree un objet de configuration
// Stockage des fichiers images téleverssées par l'utilisateu
const storage = multer.diskStorage({
  //on stocke les images
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  // on renomme les images
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  },
});

// on rend le fichier exportable
module.exports = multer({ storage }).single('image');
