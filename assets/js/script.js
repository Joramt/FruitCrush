"use strict";

/**********************
 *  Variables Global  *
 **********************/
var game = null;
var canvasBg = document.getElementById("bg-canvas");
var ctxBg = canvasBg.getContext("2d");
var canvas = document.getElementById("board-canvas");
var canvas2 = document.getElementById("canvasSup");
var ctx = canvas.getContext("2d");
var ctx2 = canvas2.getContext("2d");
var isSelected = false ;    // si un fruit est ramasser
var fruitImages = gameImages();
var txtScore = document.getElementById("txt-score");
var txtHighScore = document.getElementById("txt-high-score");
var isGameStarted = false;
// Decale le context parce que les premieres bordure haut et gauche de la planche sont coupé en deux
ctxBg.translate(BOARDOFFSETX,BOARDOFFSETY);
ctx.translate(BOARDOFFSETX,BOARDOFFSETY);

function Game() {
    this.board = [];
    this.click1 = null; // la Tile ramasser
    this.click2 = null; // la Tile ou le fruit est deposer
    this.score = 0;
    this.highScore = 0;
    this.getTile = function (coord) {
        return this.board[coord.x][coord.y];
    };
    // la tile et ca destination(coord)
    this.moveTile = function (tile, coord) {
        animFallDown(tile, coord);
        this.removeTile(tile);
        // ajouter les nouveau coord a la tile
        tile.coord = coord;
        this.board[coord.x][coord.y] = tile;
    };
    this.addTile = function (tile) {
        return this.board[tile.coord.x][tile.coord.y] = tile;
    };
    this.removeTile = function (tile) {
        try{
            ctx.clearRect(tile.coordPixel().x + BORDERSIZE/2, tile.coordPixel().y + BORDERSIZE/2,
                CELLSIZE - BORDERSIZE, CELLSIZE - BORDERSIZE);
            this.board[tile.coord.x][tile.coord.y] = null;
        }catch(e){
            console.log("dans catch removeTile()");
            console.log("tile a supprimer", tile);
            console.log(e);
        }

    };
    // changer deux Tile de position et redessiner quand le movement est legal
    this.switchTile = function(tile1, tile2){
        // changer le type entre deux cellule
        var tempType = tile1.type;
        tile1.type = tile2.type;
        tile2.type = tempType;
    };
    this.updateScore = function(matches){
        if (isGameStarted){
            for(var index in matches){
                //console.log(matches[index]);
                var matchSize = matches[index].tiles.length;
                this.score += Math.pow(2, matchSize) * 10;
                if(DEBUGSCORE) {
                    console.log("score + ", Math.pow(2, matchSize) * 10);
                }
            }
            txtScore.innerHTML = "" + this.score;
            this.updateHighScore();

        }
    };
    this.addLineToScore = function(){
        if (isGameStarted){
            this.score += 128;
            this.updateHighScore();
            txtScore.innerHTML = "" + this.score;
            if(DEBUGSCORE){
                console.log("score + ", 128);
            }
        }

    };
    this.updateHighScore = function(){
        //check si le highScore à été depassé et l'update en consequence
        if(this.score > this.highScore){
            this.highScore = this.score;
            localStorage.setItem(LOCALSTORAGEHIGHSCORE, this.highScore);
            txtHighScore.innerHTML = this.highScore;
        }
    }
}
/***************
 *  Fonctions  *
 ***************/

// load les images en memoire une seule fois et retourne leur adresses au Tiles
function gameImages(){
    var arrImages = [];
    for(var index in IMAGESNAME){
        var img = new Image();
        img.src = PATHIMAGE + IMAGESNAME[index];
        arrImages.push(img);
    }
    return arrImages;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
// initialize la tableau de jeu
function initBoard(game) {
    for (var i = 0; i < COLUMN; i++) {
        game.board[i] = new Array(ROW);
        for(var y=0; y < ROW; y++){
            // genere des tiles aleatoire dans tour le tableau
            generateTile(game, new Coord(i, y));
        }
    }

    destroyTiles(game);

    for (i = 0; i < COLUMN; i++) {
        for(y=0; y < ROW; y++){
            drawTile(game.board[i][y]);
        }
    }

}
// function s'apelle recursivement avec un delay pour laisser le temps au fruit de descendre avant d'etre detruit
function destroyTiles(game){
    var matches = getMatches(game);
    if(matches.length != 0){
        //console.log("matche taille ", matches);
        game.updateScore(matches);
        removeMatchesFromBoard(game, matches);
        applyGravity(game);
        setTimeout(function() {
            destroyTiles(game);
            // Demare le pointage une fois que les tiles match de base on ete enlevé
            if(!isGameStarted){
                setTimeout(function(){
                    isGameStarted = true;
                },NEWTILESPAWNSPEED);
            }
        },NEWTILESPAWNSPEED);
    }else{
        var checkForLostGame = new CheckForLostGame(game.board);
        checkForLostGame.check();
    }

}

function createSuperTile(game, tile){
    try {
        var rnd_type = Math.floor(Math.random() * 2) + 1;
        tile.type += ( 7 * rnd_type);
        drawTile(tile);
        game.addTile(tile);
    }catch(e){
        // TODO exception quand plusieur Tile sont detruite simultaneant
        // pour reproduire reduire le nombre de Tiles a 3 dans la config et lancer le jeu
        console.log(e);
    }
}

function createMegaTile(game, tile){
    tile.type = MEGATYPE;
    drawTile(tile);
    game.addTile(tile);
}

function isTileSameType(tile1, tile2, game){
    try {
        var equals = false;
        if (
            (tile1.type == tile2.type) ||
            (tile1.type + 7 == tile2.type) ||
            (tile1.type + 14 == tile2.type) ||
            (tile1.type == tile2.type + 7) ||
            (tile1.type == tile2.type + 14)

        )
            equals = true;

        return equals;
    }catch(e){
    }
}

// Ajoute le match a "allMatches"
function addMatches(allMatches, currentMatch){
    // si le match n'a pas deja ete trouver alors le sauver
    if(! isMatchAlreadyFound(allMatches, currentMatch)){
        var obj = getIntersectingMatch(allMatches, currentMatch);
        if(obj != null){
            addIntersectingTilesToMatch(obj);
        }else {
            allMatches.push(currentMatch);
        }
    }
}
// retourne la tile si deux match se croise
function getIntersectingMatch(allMatches, match){
    var tileIntersecting = null;
    // bouche sur tout les Match dans allMatches
    for(var index in allMatches){
        // Boucle sur les Tiles dans le Match courrant
        for(var i in allMatches[index].tiles){
            // Boucle sur les Tiles du macth pour trouver une intersection
            for(var idx in match.tiles){
                if(allMatches[index].tiles[i].coord.equals(match.tiles[idx].coord)){
                    // retourne le match qui contient l'intersection et le tile commun
                    /*
                    * Object obj:
                    * firstMatch: le match a qui on doir ajouter les tiles qui l'intersect
                    * match: le Match qui intersecte avec firstMatch
                    * tile: la tile qui est commune au deux match
                    * */
                    var obj = {
                        firstMatch: allMatches[index],
                        match: match,
                        tile: match.tiles[idx]
                    };
                    return obj;
                }
            }
        }
    }
    return null;
}
function addIntersectingTilesToMatch(obj){
    /*
     * Object obj:
     * firstMatch: le match a qui on doir ajouter les tiles qui l'intersect
     * match: le Match qui intersecte avec firstMatch
     * tile: la tile qui est commune au deux match
     * */

    // Boucle sur le match et ajoute les Tile qui n'intersecte pas
    for(var index in obj.match.tiles){
        if(! obj.match.tiles[index].coord.equals(obj.tile.coord)){
            obj.firstMatch.tiles.push(obj.match.tiles[index]);
        }
    }
}
// cette fonction detecte si un match a deja ete enregistrer par exemple:
// xxxx et xxx compte seulement pour 1 match
function isMatchAlreadyFound(allMatches, match){
    // bouche sur tout les Match dans allMatches
    for(var index in allMatches){
       // console.log("m:", allMatches[index]);
        // Boucle sur les Tiles dans le Match courrant
        for(var i in allMatches[index].tiles){
            //console.log("t:", allMatches[index].tiles[i]);
            if(allMatches[index].tiles[i].coord.equals(match.tiles[0].coord) &&
                isMatchSameDirection(allMatches[index], match)){
                return true;
            }
        }
    }
    return false;
}
function isMatchSameDirection(match1, match2){
    return match1.isVertical == match2.isVertical;
}
function getMatches(game){
    // tableau d'objet Match
    var allMatches = [];

    // Loop sur chaque fruit
    for (var y = 0; y < ROW; y++) {
        for (var x = 0; x < COLUMN; x++) {
            var tile = game.getTile(new Coord(x, y));
            var nbMatch = 1;

            /************************************************************
            * Recherche VERTICAL vers le bas pour les Tile de meme type *
            * ***********************************************************/
            var y2 = y + 1;
            while(y2 < ROW && isTileSameType(game.getTile(new Coord(x, y2)), tile, game) && nbMatch < 200){
                y2++;
                nbMatch++;
            }

            // traiter match >=3 vertical
            if(nbMatch >= 3) {
                var currentMatch = new Match(true);
                // stock les tile du match courrant dans un tableau
                for(var i = 0; i < nbMatch; i++){
                    currentMatch.tiles.push(game.getTile(new Coord(x, y + i)));
                }
                // Ajoute le match a "allMatches"
                addMatches(allMatches, currentMatch);
                //console.log("position V:", x, ":", y, "match =", nbMatch, "arr:", currentMatch);
            }
            /******************************************************************
             * Recherche HORIZONTAL vers la droite pour les Tile de meme type *
             ******************************************************************/
            nbMatch = 1;
            var x2 = x +1;
            while(x2 < COLUMN && isTileSameType(game.getTile(new Coord(x2, y)), tile, game) && nbMatch < 200){
                x2++;
                nbMatch++;
            }
            // traiter match >=3 horizontal
            if(nbMatch >= 3) {
                var currentMatch = new Match(false);
                // stock les tile du match courrant dans un tableau
                for(var i = 0; i < nbMatch; i++){
                    currentMatch.tiles.push(game.getTile(new Coord(x + i, y)));
                }
                // Ajoute le match a "allMatches"
                addMatches(allMatches, currentMatch);
                //console.log("position H:", x, ":", y, "match =", "arr:", nbMatch, currentMatch);
            }
        }
    }
    //console.log("All Matches:", allMatches.length, allMatches);

    return allMatches;
}
function removeMatchesFromBoard(game, allMatches){
    for(var index in allMatches){
        for(var i in allMatches[index].tiles){
            game.removeTile(allMatches[index].tiles[i]);

            if((allMatches[index].tiles[i].type >= 7) && (allMatches[index].tiles[i].type <= 13)){
                console.log("destroy H");
                destroyHorizontal(game, allMatches[index].tiles[i]);
                game.addLineToScore();

            }else if(allMatches[index].tiles[i].type > 21){
                console.log("destroyV");
                destroyVertical(game, allMatches[index].tiles[i]);
                game.addLineToScore();
            }
            else if(allMatches[index].tiles[i].type == MEGATYPE){
                explodeIn4Radius(game, allMatches[index].tiles[i]);
            }
        }
    }
    var length = (parseInt(i)+1);
    var rnd_tile = Math.floor(Math.random() * length);

    if(length == 4){
        createSuperTile(game, allMatches[0].tiles[rnd_tile]);
    }
    else if(length == 5)
       createMegaTile(game,allMatches[0].tiles[rnd_tile]);
}

function destroyHorizontal(game, tile){
    for(var i = 0; i< ROW; i++) {
        game.removeTile(new Tile(tile.type,new Coord(i, tile.coord.y)));
    }
}

function destroyVertical(game, tile){
    for(var i = 0; i< COLUMN; i++) {
        game.removeTile(new Tile(tile.type,new Coord(tile.coord.x, i)));
    }
}

function explodeIn4Radius(game, tile){
    var start_Y = tile.coord.y -2;
    var start_X = tile.coord.x -2;
    var end_Y = tile.coord.y + 2;
    var end_X = tile.coord.x + 2;
    console.log("explode");

    if(start_Y < 0)
        start_Y = 0;

    if(start_X < 0)
        start_X = 0;

    if(end_Y > COLUMN )
        end_Y = COLUMN;

    if(end_X > ROW )
        end_X = ROW;

    for(var i=start_Y ; i <= end_Y;i++){
        for(var j = start_X ; j <= end_X; j++){
            console.log("I" + i + "/" + j);
            game.removeTile(new Tile(tile.type,new Coord(j, i)));

        }

    }
    applyGravity(game);
}

// creer une tile random a ces coord
function generateRandomTile(coord){
    var type = Math.floor(Math.random() * NBTYPES);
    var tile = new Tile(type,coord);
    //tile.img = images[tile.type];
    return tile
}
// ajoute une tile a ces coordonee
function generateTile(game, coord){
    var tile = generateRandomTile(coord);
    game.addTile(tile);
    return tile;
}

// Dessine une cellule avec un delaie
function spawnNewTile(game, coord){
    var tile = generateRandomTile(coord);
    game.addTile(tile);
    setTimeout(function() {
        drawTile(tile);
    }, NEWTILESPAWNSPEED);
    return tile;
}

function drawBackground(){
    ctxBg.save();
    ctxBg.fillStyle = "#E4E4E4";
    ctxBg.fillRect(0,0,WIDTH, HEIGHT);
    ctxBg.restore();

    function drawLine(ctx,start,end,color, lineSize){
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(start.x,start.y);
        ctx.lineTo(end.x,end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineSize;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    // dessine les lignes
    for(var i = 0; i <= ROW; i++){
        drawLine(ctxBg,new Coord(0,i * CELLSIZE),new Coord(WIDTH, i * CELLSIZE), "black", BORDERSIZE);
    }
    // dessine les colonnes
    for(var i = 0; i <= COLUMN; i++){
        drawLine(ctxBg,new Coord(i * CELLSIZE,0),new Coord(i * CELLSIZE, HEIGHT), "black", BORDERSIZE);
    }
}

// dessin instantané
function drawTile(tile){
    drawImage(tile);
    //drawTileNumbers(tile);
}
function drawImage(tile){
    ctx.save();
    ctx.clearRect(tile.coordPixel().x, tile.coordPixel().y, CELLSIZE, CELLSIZE);
    ctx.drawImage(tile.imga(),
        tile.coordPixel().x + IMAGEOFFSETPOSITION,
        tile.coordPixel().y + IMAGEOFFSETPOSITION,
        IMGSIZE,
        IMGSIZE);
    ctx.restore();
}

function drawTileNumbers(tile){
    // dessine le type
    //ctx.fillText(tile.type,tile.coordPixel().x+20,tile.coordPixel().y+30);

    //dessine les coordonnée pour (debugger)
    //ctx.save();
    //ctx.strokeStyle = 'white';
    //ctx.fillStyle = "black";
    //ctx.font = '12pt Verdana';
    //ctx.strokeText(tile.coord.x + "," + tile.coord.y,tile.coordPixel().x+10,tile.coordPixel().y+30);
    //ctx.fillText(tile.coord.x + "," + tile.coord.y,tile.coordPixel().x+10,tile.coordPixel().y+30);
    //ctx.restore();
}

function applyGravity(game){
    // trouve un trou et le remplit
    var coord;
    while(coord = getNextHole(game.board)){
        fillHole(game, coord);
    }
}
// remplie un trou en appliquant la gravité
function fillHole(game, holeCoord){

    // si sur premiere ligne alors creer aleatoirement
    if(holeCoord.y == 0){
        spawnNewTile(game, holeCoord);
    }else{
        var found = false;
        // trouver la premiere cellule disponible
        for(var y = holeCoord.y - 1; y >= 0; y--){
            var tile = game.getTile(new Coord(holeCoord.x, y));
            if(tile != null){
                // lorse que trouver, remplacer et rapeller recursivement
                game.moveTile(tile, holeCoord);
                fillHole(game, new Coord(holeCoord.x, holeCoord.y - 1));
                found = true;
                break;
            }
        }
        // si aucune cellule disponible alors en creer une et rapeller recursivement
        if(! found){
            spawnNewTile(game, holeCoord);
            fillHole(game, new Coord(holeCoord.x, holeCoord.y - 1));
        }
    }
}
function getNextHole(board){
    // scan board de gauche a droite et bas vers haut pour trouver cellule vide
    // TODO pourait etre optimisé en recevant les derniere coordonnee en parametre optionnel
    for(var x = 0; x < COLUMN; x++){
        for(var y = ROW-1; y >= 0; y--) {
            if(board[x][y] == null){
                return new Coord(x, y);
            }
        }
    }
    return null;
}
function initGame(){
    isGameStarted = false;
    game = new Game();
    game.score = 0;
    txtScore.innerHTML = game.score;
    // laisse le temps au browser de tous metre en memoir avant de demarer le jeu
    setTimeout(function() {
        initHighScore(game);
        drawBackground();
        initBoard(game);
        prepareCanvas(game);
    },500);
}
function initHighScore(game){
    game.highScore = localStorage.getItem(LOCALSTORAGEHIGHSCORE);
    if (game.highScore == null){
        game.highScore = 0
    }
    txtHighScore.innerHTML = game.highScore;
}
function animFallDown(tile, coord){

    var y = tile.coordPixel().y;
    var x = tile.coordPixel().x;
    var interval = setInterval(function () {

        // si la cellule est pour depasser la ca case parce quelle avance trop vile alors la dessiner dans sa case
        if(y + FALLDOWNSPEED >= coord.y * CELLSIZE){
            ctx.clearRect(x + BORDERSIZE / 2, y + BORDERSIZE / 2,
                CELLSIZE - BORDERSIZE, CELLSIZE - BORDERSIZE);
            drawTile(tile);
            clearInterval(interval);
        }else{
            ctx.save();
            ctx.clearRect(x + BORDERSIZE / 2, y + BORDERSIZE / 2,
                CELLSIZE - BORDERSIZE, CELLSIZE - BORDERSIZE);
            y += FALLDOWNSPEED;

            ctx.beginPath();

            // animer les fruit
            ctx.drawImage(tile.imga(),
                x + IMAGEOFFSETPOSITION,
                y + IMAGEOFFSETPOSITION,
                IMGSIZE,
                IMGSIZE);

            ctx.restore();
            // dessine les numero
            //ctx.save();
            //ctx.fillText(tile.type, x + 20, y + 30);
            //ctx.restore();
        }

        if (y >= coord.y * CELLSIZE) {
            clearInterval(interval);
        }
    }, 1);
}
// ajoute des mouse listener au canvas
function prepareCanvas(game) {
    var clickCount = 0;
    var mousePosX;
    var mousePosY;

    canvas2.addEventListener('mousedown', function(evt){
        mousePosX = evt.layerX;
        mousePosY = evt.layerY;
        try {
            game.click1 = getTileClicked(mousePosX, mousePosY, game);
            isSelected = true;
            canvas2.style.cursor = "none";
            //console.log(game.click1.type);
            // effacer le fruit avant de le ramasser
            var tile = game.click1;
            ctx.clearRect(tile.coordPixel().x,tile.coordPixel().y, CELLSIZE, CELLSIZE);
            //console.log(game.click1);
            //console.log(game.click1.coord);
            //console.log(game.click1.coordPixel());
            //console.log(game.click1.imga());
        }catch(e){
            // click en dehors du plateau
            console.log("catch en dehors");
        }
    });
    // deplacer le fruit
    canvas2.addEventListener('mousemove',function(evt){
        if(isSelected) {
            // redessiner le fruit
            ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
            ctx2.drawImage(game.click1.imga(),
                evt.layerX-IMGSIZE/2,
                evt.layerY-IMGSIZE/2,
                IMGSIZE,
                IMGSIZE);
        }
    });
    // lorse que le fruit est relacher hors du canvas
    window.addEventListener('mouseup', function (evt) {
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

        canvas2.style.cursor = "initial";
        // redessiner le fruit a ca place s'il n'y est pas deja
        if(isSelected){
            drawTile(game.click1);
        }
        isSelected = false;
    });
    // lors du relachement de la souris verifier si l'ation est permise
    canvas2.addEventListener('mouseup', function (evt) {
        mousePosX = evt.layerX;
        mousePosY = evt.layerY;
        try {
            game.click2 = getTileClicked(mousePosX, mousePosY, game);
            if(game.click1.type == MEGATYPE ){
                explodeIn4Radius(game, game.click2);
            }
            if (isMoveValid(game)) {
                drawTile(game.click1);
                destroyTiles(game);
            }
            else {
                console.log("invalide");
                // redessiner le fruit a ca place
                drawTile(game.click1);
                // TODO : FAIRE UNE ANIMATION ? SI LE MOVE EST INVALIDE
            }
        }catch(e){
            // relachement de la souris en dehors du plateau
            // redessiner le fruit a ca place
            console.log("dans catch canvas2.addEventListener('mouseup', function (evt)");
            console.log(e);
            drawTile(game.click1)
        }
        // effacer le fruit qui a été ramassé
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        isSelected = false;
        canvas2.style.cursor = "initial";
        //canvas2.exitPointerLock();
    });
}

function isMoveValid(game) {

    var isValid = false;
    var oriTile = game.click1;
    var destTile = game.click2;
    if(
        // Si les case sont cote a cote
        (oriTile.coord.x + 1 == destTile.coord.x) && (oriTile.coord.y == destTile.coord.y) ||
        (oriTile.coord.x - 1 == destTile.coord.x) && (oriTile.coord.y == destTile.coord.y) ||
        (oriTile.coord.y + 1 == destTile.coord.y) && (oriTile.coord.x == destTile.coord.x) ||
        (oriTile.coord.y - 1 == destTile.coord.y) && (oriTile.coord.x == destTile.coord.x)
    )
    {
        game.switchTile(oriTile, destTile);
        // vrai si le switch cause un Match
        if( (getMatches(game).length != 0) || CHEATMODE){
            // afficher
            //drawTile(game.click1);
            //drawTile(game.click2);
            isValid = true;
        }else{
            //sinon, canceler le switch
            game.switchTile(destTile, oriTile);
        }
    }

    return isValid;
}

function getTileClicked(mousePosX, mousePosY, game) {
    //On soustrait l'offset du canvas a la position X de la souris, puis on arrondi a l'entier supérieur
    //après l'avoir divisé par la taille d'une cellule. Enfin on retranche 1 pour obtenir l'indice
    //Ex : ma souris se trouve en 275
    //( sachant que chaque case fait 50px et qu'il y a un décalage de 50 px on se trouve donc a la 5 eme case )
    // 275 - 50 = 225
    // 225/50 = 4.xxx
    // math.ceil = 5; <- La case
    // 5 - 1 = 4 <- L'indice de celle-ci
    // la 5eme case correspond bien a celle stocké a l'indice 4
    var coordX = Math.ceil((mousePosX - BOARDOFFSETX) / CELLSIZE)-1;
    var coordY = Math.ceil((mousePosY - BOARDOFFSETY) / CELLSIZE)-1;
    var clickCoord = new Coord(coordX, coordY);
    var tileClicked = game.getTile(clickCoord);

    return tileClicked;
}

/**********
 *  Main  *
 **********/
initGame();