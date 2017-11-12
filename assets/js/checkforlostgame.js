function CheckForLostGame(board){
    this.board = clone(board);
    this.Direction = {"UP":0, "RIGHT":1, "DOWN":2, "LEFT":3};
    this.possibleMove = 0;

    this.check = function(){
        //Boucle sur chaque elements du tableau
        this.possibleMove = 0;
        for (var y = 0; y < ROW; y++) {
            for (var x = 0; x < COLUMN; x++) {
                // Boucle sur chaque direction
                for(var i in this.Direction){
                    //console.log(this.Direction[i]);
                    var tile = this.getTile(new Coord(x, y));
                    this.switchTileAndCheck(tile, this.Direction[i]);
                }
            }
        }
        if(DEBUGPOSSIBLEMOVE){
            console.log("Possible Move:", this.possibleMove);
        }
        if(this.possibleMove == 0){
            // TODO le code pour traiter la pertie perdu ICI
            alert("Vous avez perdu :(, nouvelle partie?")
            initGame();
        }
    };
    this.getTile = function(coord){
        return this.board[coord.x][coord.y];
    };
    this.switchTileAndCheck = function(tile, direction){
        if(this.directionValid(tile.coord, direction)){
            // Le switch
            var tile2 = this.setTile2(tile.coord, direction);
            var tempType = tile.type;
            tile.type = tile2.type;
            tile2.type = tempType;

            this.scanForValidMatch();
            this.undoSwitchTile(tile, tile2);
        }
    };
    this.undoSwitchTile = function(tile, tile2){
        var tempType = tile.type;
        tile.type = tile2.type;
        tile2.type = tempType;
    };
    this.setTile2 = function(coord, direction){
        switch(direction) {
            case this.Direction.UP:
                return this.getTile(new Coord(coord.x, coord.y-1));
                break;
            case this.Direction.RIGHT:
                return this.getTile(new Coord(coord.x+1, coord.y));
                break;
            case this.Direction.DOWN:
                return this.getTile(new Coord(coord.x, coord.y+1));
                break;
            case this.Direction.LEFT:
                return this.getTile(new Coord(coord.x-1, coord.y));
                break;
            default:
                console.log("error asfddad")
        }
    };
    this.directionValid = function(coord, direction){
        switch(direction) {
            case this.Direction.UP:
                return coord.y != 0;
            case this.Direction.RIGHT:
                return coord.x != COLUMN-1;
            case this.Direction.DOWN:
                return coord.y != ROW-1;
            case this.Direction.LEFT:
                return coord.x != 0;
            default:
                console.log("error asdad")
                return false;
        }
    };
    this.scanForValidMatch = function(){
        for (var y = 0; y < ROW; y++) {
            for (var x = 0; x < COLUMN; x++) {
                var tile = this.getTile(new Coord(x, y));
                var nbMatch = 1;

                /************************************************************
                 * Recherche VERTICAL vers le bas pour les Tile de meme type *
                 * ***********************************************************/
                var y2 = y + 1;
                while(y2 < ROW && isTileSameType(this.getTile(new Coord(x, y2)), tile) && nbMatch < 200){
                    y2++;
                    nbMatch++;
                }
                // traiter match >=3 vertical
                if(nbMatch >= 3) {
                    this.possibleMove++;
                }
                /******************************************************************
                 * Recherche HORIZONTAL vers la droite pour les Tile de meme type *
                 ******************************************************************/
                nbMatch = 1;
                var x2 = x +1;
                while(x2 < COLUMN && isTileSameType(this.getTile(new Coord(x2, y)), tile) && nbMatch < 200){
                    x2++;
                    nbMatch++;
                }
                // traiter match >=3 horizontal
                if(nbMatch >= 3) {
                    //console.log("move possible avec", tile);
                    this.possibleMove++;
                }
            }
        }
    }
}