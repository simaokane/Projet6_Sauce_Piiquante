const Sauce = require('../models/sauce.js');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id; //retirer id geéré par la base de doné
  delete sauceObject.userId; // retirer id de l'utilisateur

  // on commence par tester l'existance du fichier image

  if (req.file && req.file.mimetype.split('/')[0] === 'image') {
    // Création d'une nouvelle sauce
    const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${
        req.file.filename
      }`,
    });
    // enregistrement de la sauce dans la base de donnée
    sauce
      .save()
      .then(() => {
        res.status(201).json({ message: ' Object enregistré avec succès !' });
      })
      .catch(() => {
        res.status(400).json({ error });
      });
  } else {
    res.status(400).json({ error: 'image non trouvée' });
  }
};

exports.modifySauce = (req, res, next) => {
  //on teste s'il y'a un objet et on extrait
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.thing),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${
          req.file.filename
        }`,
      }
    : {
        ...req.body,
      };
  delete sauceObject.userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({
          message: "Vous n'avez pas l'autorisation de modifier ce contenu!",
        });
      } else {
        // Supprimer l'ancienne image (sauf si image par défaut)
        const filename = sauce.imageUrl.split('/images/')[1];
        if (sauceObject.imageUrl != undefined && filename != 'default.png') {
          fs.unlink(`images/${filename}`, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
        // Mettre à jour la sauce
        Sauce.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() =>
            res.status(200).json({ message: 'Votre objet a été modifié !' })
          )
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: 'Non autorisé! ' });
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'objet supprimé avec succès !' });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getSauceById = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      //Mettre l'image par défaut si absence d'image
      const savedFilename = sauce.imageUrl.split('/images/')[1];
      if (fs.existsSync(`images/${savedFilename}`) != true) {
        sauce.imageUrl = `${req.protocol}://${req.get(
          'host'
        )}/images/default.png`;
      }
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      /* Mettre des images par défaut si absence d'images */
      for (let i = 0; i < sauces.length; i++) {
        const savedFilename = sauces[i].imageUrl.split('/images/')[1];
        if (fs.existsSync(`images/${savedFilename}`) != true) {
          sauces[i].imageUrl = `${req.protocol}://${req.get(
            'host'
          )}/images/default.png`;
        }
      }
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.likeSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    // Si l'utilisateur like la sauce
    if (req.body.like == 1 && !sauce.usersLiked.includes(req.auth.userId)) {
      Sauce.updateOne(
        { _id: req.params.id },
        { $push: { usersLiked: req.auth.userId }, $inc: { likes: +1 } }
      )
        .then(() => {
          res.status(200).json({ message: 'Vous aimez ce poste' });
        })
        .catch((error) => res.status(400).json({ error }));
    }

    // Si l'utilisateur dislike la sauce
    else if (
      req.body.like == -1 &&
      !sauce.usersDisliked.includes(req.auth.userId)
    ) {
      Sauce.updateOne(
        { _id: req.params.id },
        { $push: { usersDisliked: req.auth.userId }, $inc: { dislikes: +1 } }
      )
        .then(() => {
          res.status(200).json({ message: "Vous n'aimez pas ce poste" });
        })
        .catch((error) => res.status(400).json({ error }));
    }

    // Si l'utilisateur retire son like/dislike
    else {
      if (sauce.usersLiked.includes(req.auth.userId)) {
        Sauce.updateOne(
          { _id: req.params.id },
          { $pull: { usersLiked: req.auth.userId }, $inc: { likes: -1 } }
        )
          .then(() => {
            res.status(200).json({ message: ' like annulé' });
          })
          .catch((error) => res.status(400).json({ error }));
      } else if (sauce.usersDisliked.includes(req.auth.userId)) {
        Sauce.updateOne(
          { _id: req.params.id },
          { $pull: { usersDisliked: req.auth.userId }, $inc: { dislikes: -1 } }
        )
          .then(() => {
            res.status(200).json({ message: 'dislike annulé' });
          })
          .catch((error) => res.status(400).json({ error }));
      }
    }
  });
};
