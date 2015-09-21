/*global Math */
/*eslint-env browser */
/*eslint no-console:0 */
var com;
if (!com || !com.javecross || !com.javecross.editor) {
    throw new Error('Global namespaced is not yet defined!');
}
/**
 * Web Tile Editor - Board Converter [ GRAAL ]
 * <p>
 * Web tile editor converters must implement the following
 * prototype metods:
 * 1. getMaximumBoardWidth
 * 2. getMaximumBoardHeight
 * 3. convertToEditorBoard
 * 4. convertFromEditorBoard
 * 5. getTileSize
 *
 * @returns {GraalLevelConverter}
 */

function GraalLevelConverter() {
    'use strict';
    this.TILE_SIZE = 16;
    this.CHUNK_WIDTH = 16;
    this.CHUNK_HEIGHT = 4;
    this.SQUARE = 8;

    this.PATTERN = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
        'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
        'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '0', '1', '2', '3',
        '4', '5', '6', '7', '8', '9', '+', '/'
    ];
    this.BOARD_TILE_REGEX = /(.{2})/gm;


    this.CHUNK_HORIZ_OFFSET = this.CHUNK_WIDTH * this.TILE_SIZE;
    this.CHUNK_VERT_OFFSET = this.CHUNK_HEIGHT * this.TILE_SIZE;

    this.BOARD_STARTSWITH = 'BOARD';
    this.BOARD_LINE_SPLIT_LENGTH = 6;
    this.BOARD_LINE_TILE_LENGTH = 64;
}

GraalLevelConverter.prototype.getMaximumBoardWidth = function () {
    'use strict';
    return this.BOARD_LINE_TILE_LENGTH * this.TILE_SIZE;
};

GraalLevelConverter.prototype.getMaximumBoardHeight = function () {
    'use strict';
    return this.BOARD_LINE_TILE_LENGTH * this.TILE_SIZE;
};

GraalLevelConverter.prototype.getTileSize = function () {
    'use strict';
    return this.TILE_SIZE;
};

/*
 * Graal nw level converter.
 * <p>
 * Currently there is no support for the additional level properties:
 * 1. Level links (not parsed)
 * 2. Signs
 * 3. NPCs, graphical or otherwise.
 *
 * Support is planned.
 *
 * @param {String} plaintext The text string for the level
 * @returns {Object} WebEditor board structure.
 */
GraalLevelConverter.prototype.convertToEditorBoard = function (plaintext) {
    'use strict';
    var editorBoard = [],
            boardLines = plaintext.split('\n'),
            lineNumber,
            line;

    try {
        for (lineNumber in boardLines) {
            line = boardLines[lineNumber];
            if (line.startsWith(this.BOARD_STARTSWITH)) {
                editorBoard.push(this.parseSingleBoardLine(line));
            }
        }
    } catch (err) {
        console.log(err);
        editorBoard = [];
    }
    return editorBoard;
};

GraalLevelConverter.prototype.parseSingleBoardLine = function (boardLine) {
    'use strict';
    var
            parsedLine = {},
            tempTiles,
            tokenized = boardLine.split(' ');

    if (tokenized.length !== this.BOARD_LINE_SPLIT_LENGTH) {
        throw new Error('Unknown board line format, perhaps corrupted?');
    }

    parsedLine.layerIndex = tokenized[1];
    parsedLine.yIndex = tokenized[2];
    parsedLine.tiles = [];
    tempTiles = tokenized[5].match(this.BOARD_TILE_REGEX);
    for (var index in tempTiles) {
        parsedLine.tiles.push(this.convertGraalTileToXY(tempTiles[index]));
    }

    if (parsedLine.tiles.length !== this.BOARD_LINE_TILE_LENGTH) {
        console.log('Error parsing board line: ' + tokenized[2]);
        throw new Error('Invalid board tile length, doesn\'t match known format.');
    }
    return parsedLine;
};

GraalLevelConverter.prototype.convertFromEditorBoard = function (editorBoard) {
    'use strict';
    console.log('Convert to your garbage.');
    console.log(editorBoard);
};

GraalLevelConverter.prototype.convertGraalTileToXY = function (graalTile) {
    'use strict';
    var
            chars = graalTile.split(''),
            indexOne = this.PATTERN.indexOf(chars[0]),
            indexTwo = this.PATTERN.indexOf(chars[1]),
            column = Math.floor(indexOne / this.SQUARE),
            row = indexOne % this.SQUARE,
            subsetRow = Math.floor(indexTwo / this.CHUNK_WIDTH),
            subsetColumn = indexTwo % this.CHUNK_WIDTH,
            x = column * this.CHUNK_HORIZ_OFFSET,
            y = row * this.CHUNK_VERT_OFFSET;

    x += subsetColumn * this.TILE_SIZE;
    y += subsetRow * this.TILE_SIZE;

    return [x, y];
};

GraalLevelConverter.prototype.convertXYToGraalTile = function (x, y) {
    'use strict';
    var
            tilePosX = x / this.TILE_SIZE,
            tilePosY = y / this.TILE_SIZE,
            chunkX = Math.floor(tilePosX / this.CHUNK_WIDTH),
            chunkY = Math.floor(tilePosY / this.CHUNK_HEIGHT),
            chunkIndex = chunkX * this.SQUARE + chunkY,
            modSubX = chunkX === 0 ? this.CHUNK_WIDTH : chunkX * this.CHUNK_WIDTH,
            modSubY = chunkY === 0 ? this.CHUNK_HEIGHT : chunkY * this.CHUNK_HEIGHT,
            subTileX = tilePosX % modSubX,
            subTileY = tilePosY % modSubY,
            subIndex = subTileX + subTileY * this.CHUNK_WIDTH,
            tileId = this.PATTERN[chunkIndex] + '' + this.PATTERN[subIndex];
    return tileId;
};
