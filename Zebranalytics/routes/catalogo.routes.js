const express = require('express');
const router = express.Router();
const isAuth = require('../util/is-auth');
const canSee = require('../util/can-see');
const catalogoController = require('../controllers/catalogo.controller');

router.get('/', isAuth, canSee, reviewsController.get_reviews);
router.post('/', isAuth, canSee, reviewsController.post_reviews);