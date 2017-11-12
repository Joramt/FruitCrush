/*************
 *  Entités  *
 ************/
function Coord(x, y) {
    this.x = x;
    this.y = y;
    this.toString = function(){
        return x + ", " + y;
    };
    this.equals = function(coord){
        return JSON.stringify(this) === JSON.stringify(coord);
    }
}

function Tile(type, coord) {
    this.type = type;
    this.imga = function () {
        return fruitImages[this.type];
    };
    this.coord = coord;
    this.coordPixel = function () {
        return new Coord(this.coord.x * CELLSIZE, this.coord.y * CELLSIZE);
    };
}
// Objet contenant la liste des Tiles constituant un match
function Match(isVertical){
    this.tiles = [];
    this.isVertical = isVertical;
}