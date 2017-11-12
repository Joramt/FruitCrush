/***************
 *  Constante  *
 ***************/
var CELLSIZE = 75;
var COLUMN = 8;
var ROW = 8;
var NBTYPES = 7;        // Types de base >> 7 maximum
var PATHIMAGE = "assets/images/game/";
var WIDTH = COLUMN * CELLSIZE;
var HEIGHT = ROW * CELLSIZE;
var BORDERSIZE = 2;     // Bordure des cellules
var BOARDOFFSETX = 50;
var BOARDOFFSETY = 50;
var FALLDOWNSPEED = 4;  // Vitesse de chute >> 1 == lent | 4 == vite
// La vitesse doit etre assez lente pour permettre une une case dans
// la premiere ranger de se rendre dans la derniere rangé
var NEWTILESPAWNSPEED = 800;
var IMGSIZE = 60;
var IMAGEOFFSETPOSITION = (CELLSIZE - IMGSIZE) / 2;
var LOCALSTORAGEHIGHSCORE = "highscore";
// Image de base (0-6) | Image vertical (7-13) | Image Vertical (14-20)
var IMAGESNAME = ["blueberry.png", "strawberry.png", "orange.png", "pear.png", "pineapple.png", "banana.png", "grapes.png",
    "redblueberry.png", "redstrawberry.png", "redorange.png", "redpear.png", "redpineapple.png", "redbanana.png","redgrapes.png",
    "greenblueberry.png", "greenstrawberry.png", "greenorange.png", "greenpear.png", "greenpineapple.png", "greenbanana.png", "greengrapes.png",
"megafruit.png"];
// Permet de faire des moves non valide
var CHEATMODE = true;
// debug console
var DEBUGSCORE = false;
var DEBUGPOSSIBLEMOVE = false;
var MEGATYPE = 21;
