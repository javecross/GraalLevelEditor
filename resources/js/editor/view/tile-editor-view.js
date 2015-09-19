/*global $, document */

var com;
if (!com || !com.javecross || !com.javecross.editor) {
    throw new Error('The global namespace hasn\'t been defined!');
}

$(document).ready(function () {
    'use strict';
    var
            editor = com.javecross.editor.WebEditor,
            inputSettings = {
                'tileSize': 16,
                'rootBoardCanvas': $('.board-canvas.root-canvas'),
                'activeBoardCanvas': $('.board-canvas.active-canvas'),
                'rootTilesetCanvas': $('.tileset-canvas.root-canvas'),
                'activeTilesetCanvas': $('.tileset-canvas.active-canvas')
            };

    editor.initializeWebTileEditor(inputSettings);
    editor.loadTilesetImage(editor.DEFAULT_TILESET);

});