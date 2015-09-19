
var com;
if (!com || !com.javecross || !com.javecross.editor) {
    throw new Error('Global namespaced is not yet defined!');
}

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

    this.CHUNK_HORIZ_OFFSET = this.CHUNK_WIDTH * this.TILE_SIZE;
    this.CHUNK_VERT_OFFSET = this.CHUNK_HEIGHT * this.TILE_SIZE;
}

GraalLevelConverter.prototype.convertToEditorBoard = function () {
    console.log('Convert your garbage into something useful');
};

GraalLevelConverter.prototype.convertFromEditorBoard = function (editorBoard) {
    console.log('Convert to your garbage.');
};